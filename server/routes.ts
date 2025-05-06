import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { type ParamsDictionary } from "express-serve-static-core";
import { type ParsedQs } from "qs";

// Import types from schema
import { User, userConversations } from '@shared/schema';
import { db } from '@db';
import { and, eq } from 'drizzle-orm';

// Define types for participant types
type UserConversation = {
  user: User;
  // add other fields as needed
};

// Extended request type with user property
interface AuthenticatedRequest extends Request {
  user?: User;
}
import { createServer, type Server } from "http";
import { setupWebSocketServer } from "./websocket";
import { authMiddleware, authRoutes } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { z } from "zod";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  setupWebSocketServer(httpServer);
  
  // Authentication routes
  app.post("/api/auth/register", authRoutes.register);
  app.post("/api/auth/login", authRoutes.login);
  app.post("/api/auth/verify", authRoutes.verifyEmail);
  app.post("/api/auth/logout", authMiddleware, authRoutes.logout);
  app.get("/api/auth/me", authMiddleware, authRoutes.getMe);
  
  // User routes
  app.get("/api/users/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return sensitive info
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicUrl: user.profilePicUrl,
          bio: user.bio,
          status: user.status,
          lastSeen: user.lastSeen
        }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/users/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updateSchema = z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
      });
      
      const data = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user!.id, data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          profilePicUrl: updatedUser.profilePicUrl,
          bio: updatedUser.bio
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Conversations routes
  app.get("/api/conversations", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      return res.status(200).json({ conversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/conversations", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schema = z.object({
        participantId: z.number(),
      });
      
      const { participantId } = schema.parse(req.body);
      
      // Check if participant exists
      const participant = await storage.getUserById(participantId);
      if (!participant) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const conversation = await storage.createConversation(req.user!.id, participantId);
      
      return res.status(201).json({ conversation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/conversations/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant
      const isParticipant = conversation.participants.some(
        (p) => p.user.id === req.user!.id
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to view this conversation" });
      }
      
      return res.status(200).json({ conversation });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/conversations/:id/messages", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant
      const isParticipant = conversation.participants.some(
        (p) => p.user.id === req.user!.id
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to view these messages" });
      }
      
      const messages = await storage.getConversationMessages(conversationId, limit, offset);
      
      return res.status(200).json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Groups routes
  app.get("/api/groups", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const groups = await storage.getGroups(req.user!.id);
      return res.status(200).json({ groups });
    } catch (error) {
      console.error("Get groups error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/groups", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(3),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
        isPublic: z.boolean().optional(),
        memberIds: z.array(z.number()).optional()
      });
      
      const data = schema.parse(req.body);
      
      const group = await storage.createGroup({
        name: data.name,
        description: data.description,
        photoUrl: data.photoUrl,
        ownerId: req.user!.id,
        isPublic: data.isPublic,
        memberIds: data.memberIds || []
      });
      
      return res.status(201).json({ group });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create group error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Channels routes
  app.get("/api/channels", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const channels = await storage.getChannels(req.user!.id);
      return res.status(200).json({ channels });
    } catch (error) {
      console.error("Get channels error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/channels", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(3),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
        isPublic: z.boolean().optional(),
        adminIds: z.array(z.number()).optional()
      });
      
      const data = schema.parse(req.body);
      
      const channel = await storage.createChannel({
        name: data.name,
        description: data.description,
        photoUrl: data.photoUrl,
        ownerId: req.user!.id,
        isPublic: data.isPublic,
        adminIds: data.adminIds || []
      });
      
      return res.status(201).json({ channel });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create channel error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Contacts routes
  app.get("/api/contacts", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contacts = await storage.getContacts(req.user!.id);
      return res.status(200).json({ contacts });
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/contacts/requests", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requests = await storage.getContactRequests(req.user!.id);
      return res.status(200).json({ requests });
    } catch (error) {
      console.error("Get contact requests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/contacts/requests/:id/accept", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const requestId = parseInt(req.params.id);
      
      await storage.acceptContactRequest(requestId, userId);
      return res.status(200).json({ message: "Contact request accepted" });
    } catch (error) {
      console.error("Accept contact request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/contacts/requests/:id/reject", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const requestId = parseInt(req.params.id);
      
      await storage.rejectContactRequest(requestId, userId);
      return res.status(200).json({ message: "Contact request rejected" });
    } catch (error) {
      console.error("Reject contact request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/contacts/search", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schema = z.object({
        query: z.string().min(1)
      });
      
      const { query } = schema.parse(req.body);
      const users = await storage.searchUsers(query, req.user!.id);
      return res.status(200).json({ users });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Search users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/contacts/request", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schema = z.object({
        recipientId: z.number()
      });
      
      const { recipientId } = schema.parse(req.body);
      const senderId = req.user!.id;
      
      if (senderId === recipientId) {
        return res.status(400).json({ message: "Cannot send contact request to yourself" });
      }
      
      // Check if recipient exists
      const recipient = await storage.getUserById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.createContactRequest(senderId, recipientId);
      return res.status(201).json({ message: "Contact request sent" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Send contact request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/contacts", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schema = z.object({
        contactId: z.number(),
        nickname: z.string().optional()
      });
      
      const { contactId, nickname } = schema.parse(req.body);
      
      // Check if contact exists
      const contact = await storage.getUserById(contactId);
      if (!contact) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.addContact(req.user!.id, contactId, nickname);
      
      return res.status(201).json({ message: "Contact added successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Add contact error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Media upload
  app.post("/api/media/upload", authMiddleware, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const fileUrl = `/uploads/${file.filename}`;
      
      // Save file metadata to database
      const media = await storage.saveMedia({
        uploaderId: req.user!.id,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      });
      
      return res.status(201).json({ media });
    } catch (error) {
      console.error("Upload media error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Conversation background image endpoint
  app.post("/api/conversations/:id/background", authMiddleware, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const userId = req.user!.id;
      
      // Check if the user is part of this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const isParticipant = conversation.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not part of this conversation" });
      }
      
      // Save the background image URL to the user's conversation record
      await db.update(userConversations)
        .set({ backgroundImage: `/uploads/${file.filename}` })
        .where(and(
          eq(userConversations.userId, userId),
          eq(userConversations.conversationId, conversationId)
        ));
      
      return res.status(200).json({ 
        success: true, 
        backgroundImage: `/uploads/${file.filename}` 
      });
    } catch (error) {
      console.error("Error updating conversation background:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Conversation background image endpoint
  app.post("/api/conversations/:id/background", authMiddleware, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const userId = req.user!.id;
      
      // Check if the user is part of this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const isParticipant = conversation.participants.some((p) => p.user.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not part of this conversation" });
      }
      
      // Save the background image URL to the user's conversation record
      await db.update(userConversations)
        .set({ backgroundImage: `/uploads/${file.filename}` })
        .where(and(
          eq(userConversations.userId, userId),
          eq(userConversations.conversationId, conversationId)
        ));
      
      return res.status(200).json({ 
        success: true, 
        backgroundImage: `/uploads/${file.filename}` 
      });
    } catch (error) {
      console.error("Error updating conversation background:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
    // Only authenticated users can access uploads
    if (!req.cookies?.token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }, express.static(uploadDir));
  
  return httpServer;
}
