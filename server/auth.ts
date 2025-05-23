import { Request, Response, NextFunction } from 'express';
import { User } from '../shared/schema';

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { userLoginSchema, userRegisterSchema, verifyEmailSchema } from '@shared/schema';
import { ZodError } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_teleclone';
const TOKEN_EXPIRY = '30d';

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try getting token from cookies
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).json({ message: 'No authentication token provided' });
      }
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      const user = await storage.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request
      req.user = user;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const authRoutes = {
  async register(req: Request, res: Response) {
    try {
      console.log('Received registration request:', req.body);
      const userData = userRegisterSchema.parse(req.body);
      
      try {
        // Check if user already exists
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          console.log('Email already exists:', userData.email);
          return res.status(400).json({ message: 'Email já está em uso' });
        }
        
        const existingUsername = await storage.getUserByUsername(userData.username);
        if (existingUsername) {
          console.log('Username already exists:', userData.username);
          return res.status(400).json({ message: 'Nome de usuário já está em uso' });
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return res.status(500).json({ 
          message: 'Erro de conexão com o banco de dados', 
          details: 'Verifique se a variável DATABASE_URL está configurada corretamente' 
        });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Send verification email
      await sendVerificationEmail(user.email, user.verificationCode);
      
      // For development, we'll still return the verification code
      // In production, we would remove this
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      return res.status(201).json({ 
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        // Only include verification code in development
        ...(isDevelopment && { verificationCode: user.verificationCode })
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Register error:', error);
      
      // Melhor mensagem de erro
      if (error instanceof Error && error.message.includes('getaddrinfo ENOTFOUND')) {
        return res.status(500).json({ 
          message: 'Erro de conexão com o banco de dados', 
          details: 'Não foi possível conectar ao servidor de banco de dados. Verifique se a URL do banco de dados está correta.'
        });
      }
      
      res.status(500).json({ message: 'Erro no servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  },
  
  async login(req: Request, res: Response) {
    try {
      console.log('Received login request:', req.body);
      const { email, password } = userLoginSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found:', email);
        return res.status(400).json({ message: 'Email ou senha inválidos' });
      }
      
      // Check if user is verified
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (!user.isVerified && !isDevelopment) {
        return res.status(400).json({ message: 'Email not verified', requiresVerification: true });
      }
      
      // If in development mode and user is not verified, auto-verify them
      if (!user.isVerified && isDevelopment) {
        console.log('Development mode: Auto-verifying user', user.email);
        await storage.verifyUserEmail(user.email, user.verificationCode || '');
      }
      
      // Validate password
      const isValid = await storage.validatePassword(user, password);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      // Create session
      const token = await storage.createSession(
        user.id, 
        req.headers['user-agent'],
        req.ip
      );
      
      // Update user status
      await storage.setUserStatus(user.id, 'online');
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicUrl: user.profilePicUrl
        },
        token
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  async verifyEmail(req: Request, res: Response) {
    try {
      const { email, code } = verifyEmailSchema.parse(req.body);
      
      const verified = await storage.verifyUserEmail(email, code || '');
      if (!verified) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      
      return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Verify email error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.token;
      
      if (token) {
        await storage.deleteSession(token);
        res.clearCookie('token');
      }
      
      // If we have a user, set status to offline
      if (req.user) {
        await storage.setUserStatus(req.user.id, 'offline');
      }
      
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  async getMe(req: Request, res: Response) {
    try {
      // User is attached by authMiddleware
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      return res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          username: req.user.username,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicUrl: req.user.profilePicUrl,
          bio: req.user.bio,
          status: req.user.status
        }
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
