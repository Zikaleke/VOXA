import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { User, AuthCredentials, RegisterData, VerifyEmailData } from '@/types';
import { loginUser, registerUser, logoutUser, getCurrentUser, verifyEmail, getAuthToken } from '@/lib/auth';
import { setupSocket, closeSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ verificationCode: string }>;
  verify: (verifyData: VerifyEmailData) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();

        if (token) {
          const currentUser = await getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            setupSocket(token);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: AuthCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user: loggedInUser, token } = await loginUser(credentials);
      setUser(loggedInUser);
      
      // Set up WebSocket connection
      setupSocket(token);
      
      navigate('/chat');
      
      toast({
        title: 'Login bem sucedido',
        description: `Bem-vindo de volta, ${loggedInUser.firstName}!`,
      });
    } catch (error: any) {
      setError(error.message || 'Falha no login. Verifique suas credenciais.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user: registeredUser, verificationCode } = await registerUser(userData);
      
      navigate('/auth/verify');
      
      toast({
        title: 'Registro bem sucedido',
        description: 'Verifique seu email para confirmar sua conta.',
      });
      
      return { verificationCode };
    } catch (error: any) {
      setError(error.message || 'Falha no registro. Tente novamente.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verify = async (verifyData: VerifyEmailData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await verifyEmail(verifyData);
      
      navigate('/auth/login');
      
      toast({
        title: 'Email verificado',
        description: 'Sua conta foi verificada. Você já pode fazer login.',
      });
    } catch (error: any) {
      setError(error.message || 'Falha na verificação. Verifique o código informado.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      await logoutUser();
      setUser(null);
      
      // Close WebSocket connection
      closeSocket();
      
      navigate('/auth/login');
      
      toast({
        title: 'Logout bem sucedido',
        description: 'Você foi desconectado com sucesso.',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        verify,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
