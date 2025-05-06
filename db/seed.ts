import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("Starting database seed...");
    
    // Check if we already have users
    const existingUsers = await db.query.users.findMany();
    
    if (existingUsers.length > 0) {
      console.log(`Database already has ${existingUsers.length} users. Skipping seed.`);
      return;
    }
    
    // Create sample users
    const salt = await bcrypt.genSalt(10);
    
    // Create users
    const users = [
      {
        email: "carlos@example.com",
        username: "carlos",
        password: await bcrypt.hash("password123", salt),
        firstName: "Carlos",
        lastName: "Silva",
        bio: "Desenvolvedor Full Stack",
        profilePicUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80",
        isVerified: true,
        status: "online"
      },
      {
        email: "ana@example.com",
        username: "ana",
        password: await bcrypt.hash("password123", salt),
        firstName: "Ana",
        lastName: "Lima",
        bio: "UX Designer",
        profilePicUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50",
        isVerified: true,
        status: "online"
      },
      {
        email: "pedro@example.com",
        username: "pedro",
        password: await bcrypt.hash("password123", salt),
        firstName: "Pedro",
        lastName: "Santos",
        bio: "DevOps Engineer",
        profilePicUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50",
        isVerified: true,
        status: "offline"
      },
      {
        email: "julia@example.com",
        username: "julia",
        password: await bcrypt.hash("password123", salt),
        firstName: "Julia",
        lastName: "Costa",
        bio: "Product Manager",
        profilePicUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50",
        isVerified: true,
        status: "offline"
      },
      {
        email: "marcos@example.com",
        username: "marcos",
        password: await bcrypt.hash("password123", salt),
        firstName: "Marcos",
        lastName: "Oliveira",
        bio: "Backend Developer",
        isVerified: true,
        status: "offline"
      }
    ];
    
    console.log("Creating sample users...");
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const [createdUser] = await db.insert(schema.users).values(user).returning();
        
        // Create user settings
        await db.insert(schema.userSettings).values({
          userId: createdUser.id,
          theme: "light",
          language: "pt-BR"
        });
        
        return createdUser;
      })
    );
    
    // Create contacts
    console.log("Creating contacts...");
    const contactRelations = [
      { userId: 1, contactId: 2 }, // Carlos -> Ana
      { userId: 1, contactId: 3 }, // Carlos -> Pedro
      { userId: 1, contactId: 4 }, // Carlos -> Julia
      { userId: 2, contactId: 1 }, // Ana -> Carlos
      { userId: 2, contactId: 4 }, // Ana -> Julia
      { userId: 3, contactId: 1 }, // Pedro -> Carlos
      { userId: 4, contactId: 1 }, // Julia -> Carlos
      { userId: 4, contactId: 2 }  // Julia -> Ana
    ];
    
    await Promise.all(
      contactRelations.map(async (relation) => {
        await db.insert(schema.contacts).values({
          userId: relation.userId,
          contactId: relation.contactId
        });
      })
    );
    
    // Create conversations
    console.log("Creating conversations...");
    const conversations = [
      { creatorId: 1 }, // Carlos created
      { creatorId: 2 }, // Ana created
      { creatorId: 1 }  // Carlos created
    ];
    
    const createdConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const [createdConversation] = await db.insert(schema.conversations)
          .values(conversation)
          .returning();
        return createdConversation;
      })
    );
    
    // Assign participants to conversations
    const conversationParticipants = [
      { conversationId: 1, userIds: [1, 2] }, // Carlos and Ana
      { conversationId: 2, userIds: [2, 3] }, // Ana and Pedro
      { conversationId: 3, userIds: [1, 4] }  // Carlos and Julia
    ];
    
    await Promise.all(
      conversationParticipants.map(async (convParticipant) => {
        await Promise.all(
          convParticipant.userIds.map(async (userId) => {
            await db.insert(schema.userConversations).values({
              userId,
              conversationId: convParticipant.conversationId
            });
          })
        );
      })
    );
    
    // Create sample messages
    console.log("Creating sample messages...");
    const messages = [
      // Carlos-Ana conversation
      {
        senderId: 2, // Ana
        recipientId: 1, // Carlos
        conversationId: 1,
        content: "Oi, tudo bem? Vamos marcar aquela reunião?",
        type: "text",
        status: "read",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1000),
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5000)
      },
      {
        senderId: 1, // Carlos
        recipientId: 2, // Ana
        conversationId: 1,
        content: "Olá Ana! Estou bem sim, e você?",
        type: "text",
        status: "read",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60000), // 1 day ago + 1 minute
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 61000),
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 65000)
      },
      {
        senderId: 2, // Ana
        recipientId: 1, // Carlos
        conversationId: 1,
        content: "Este é o projeto que estamos trabalhando. Podemos marcar uma reunião para discutir?",
        type: "text",
        status: "read",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 120000), // 1 day ago + 2 minutes
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 121000),
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 125000)
      },
      {
        senderId: 1, // Carlos
        recipientId: 2, // Ana
        conversationId: 1,
        content: "Claro! Que tal amanhã às 14h? Podemos fazer uma videochamada.",
        type: "text",
        status: "read",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 180000), // 1 day ago + 3 minutes
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 181000),
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 185000)
      },
      {
        senderId: 2, // Ana
        recipientId: 1, // Carlos
        conversationId: 1,
        content: "Perfeito! Vou reservar o horário. Traga suas anotações do último encontro.",
        type: "text",
        status: "read",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 240000), // 1 day ago + 4 minutes
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 241000),
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 245000)
      },
      
      // Carlos-Pedro conversation
      {
        senderId: 3, // Pedro
        recipientId: 1, // Carlos
        conversationId: 2,
        content: "Consegui resolver aquele problema do sistema!",
        type: "text",
        status: "delivered",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1000)
      },
      
      // Carlos-Julia conversation
      {
        senderId: 4, // Julia
        recipientId: 1, // Carlos
        conversationId: 3,
        content: "Os arquivos estão prontos para revisão.",
        type: "text",
        status: "read",
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000),
        readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5000)
      }
    ];
    
    await Promise.all(
      messages.map(async (message) => {
        await db.insert(schema.messages).values(message);
      })
    );
    
    // Create a group
    console.log("Creating sample group...");
    const [devTeamGroup] = await db.insert(schema.groups)
      .values({
        name: "Dev Team",
        description: "Grupo para discussões de desenvolvimento",
        ownerId: 1 // Carlos
      })
      .returning();
    
    // Add members to the group
    await Promise.all([
      db.insert(schema.groupMembers).values({
        groupId: devTeamGroup.id,
        userId: 1, // Carlos
        role: "owner"
      }),
      db.insert(schema.groupMembers).values({
        groupId: devTeamGroup.id,
        userId: 3, // Pedro
        role: "admin"
      }),
      db.insert(schema.groupMembers).values({
        groupId: devTeamGroup.id,
        userId: 5 // Marcos
      })
    ]);
    
    // Add group message
    await db.insert(schema.messages).values({
      senderId: 5, // Marcos
      groupId: devTeamGroup.id,
      content: "Vamos fazer um standup amanhã?",
      type: "text",
      status: "sent",
      sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    });
    
    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();
