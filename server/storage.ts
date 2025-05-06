import { db } from '@db';
import { 
  users, userSettings, sessions, deviceTokens, contacts, blockedUsers, 
  conversations, userConversations, messages, groups, groupMembers, 
  channels, channelMembers, mediaFiles, messageReactions, calls, callParticipants, 
  notifications
} from '@shared/schema';
import { eq, and, or, desc, isNull, sql } from 'drizzle-orm';
import { 
  type User, type UserInsert, type Message, type Conversation, 
  type Group, type Channel
} from '@shared/schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// User Management
export const storage = {
  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return result;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    return result;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return result;
  },

  async createUser(data: UserInsert): Promise<User> {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    // Generate verification code
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    const [user] = await db.insert(users).values({
      ...data, 
      password: hashedPassword,
      verificationCode
    }).returning();
    
    // Create default user settings
    await db.insert(userSettings).values({
      userId: user.id
    });
    
    return user;
  },

  async verifyUserEmail(email: string, code: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    
    if (!user || user.verificationCode !== code) {
      return false;
    }
    
    await db.update(users)
      .set({ 
        isVerified: true, 
        verificationCode: null 
      })
      .where(eq(users.id, user.id));
    
    return true;
  },

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  },

  async setUserStatus(id: number, status: 'online' | 'offline' | 'away'): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({
        status,
        lastSeen: status === 'offline' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  },

  // Authentication methods
  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  },

  async createSession(userId: number, userAgent?: string, ipAddress?: string): Promise<string> {
    // Generate session token
    const token = crypto.randomBytes(64).toString('hex');
    
    // Calculate expiry (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await db.insert(sessions).values({
      userId,
      token,
      userAgent,
      ipAddress,
      expiresAt
    });
    
    return token;
  },

  async getSessionByToken(token: string): Promise<any | undefined> {
    return db.query.sessions.findFirst({
      where: eq(sessions.token, token),
      with: {
        user: true
      }
    });
  },

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  },

  // Conversation methods
  async getConversations(userId: number): Promise<any[]> {
    return db.query.userConversations.findMany({
      where: eq(userConversations.userId, userId),
      with: {
        conversation: {
          with: {
            participants: {
              with: {
                user: true
              }
            },
            messages: {
              limit: 1,
              orderBy: [desc(messages.createdAt)],
              with: {
                sender: true
              }
            }
          }
        }
      },
      orderBy: [desc(userConversations.updatedAt)]
    });
  },

  async createConversation(creatorId: number, participantId: number): Promise<Conversation> {
    // Check if conversation already exists
    const existingConversation = await db.query.userConversations.findFirst({
      where: eq(userConversations.userId, creatorId),
      with: {
        conversation: {
          with: {
            participants: {
              where: eq(userConversations.userId, participantId)
            }
          }
        }
      }
    });

    if (existingConversation && existingConversation.conversation.participants.length > 0) {
      return existingConversation.conversation;
    }

    // Create new conversation
    const [conversation] = await db.insert(conversations)
      .values({ creatorId })
      .returning();
    
    // Add participants
    await db.insert(userConversations)
      .values([
        { userId: creatorId, conversationId: conversation.id },
        { userId: participantId, conversationId: conversation.id }
      ]);
    
    return conversation;
  },

  async getConversation(id: number): Promise<any | undefined> {
    return db.query.conversations.findFirst({
      where: eq(conversations.id, id),
      with: {
        participants: {
          with: {
            user: true
          }
        }
      }
    });
  },

  // Messages methods
  async getConversationMessages(conversationId: number, limit = 50, offset = 0): Promise<any[]> {
    return db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      with: {
        sender: true,
        media: true,
        reactions: {
          with: {
            user: true
          }
        },
        replyTo: {
          with: {
            sender: true
          }
        }
      },
      orderBy: [desc(messages.createdAt)],
      limit,
      offset
    });
  },

  async createMessage(data: {
    senderId: number,
    type?: string,
    content?: string,
    conversationId?: number,
    groupId?: number,
    channelId?: number,
    replyToId?: number
  }): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({
        senderId: data.senderId,
        type: data.type as any,
        content: data.content,
        conversationId: data.conversationId,
        groupId: data.groupId,
        channelId: data.channelId,
        replyToId: data.replyToId,
        status: 'sending'
      })
      .returning();
    
    // Update conversation or group lastUpdated
    if (data.conversationId) {
      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, data.conversationId));
      
      await db.update(userConversations)
        .set({ updatedAt: new Date() })
        .where(eq(userConversations.conversationId, data.conversationId));
    }
    
    if (data.groupId) {
      await db.update(groups)
        .set({ updatedAt: new Date() })
        .where(eq(groups.id, data.groupId));
    }
    
    if (data.channelId) {
      await db.update(channels)
        .set({ updatedAt: new Date() })
        .where(eq(channels.id, data.channelId));
    }
    
    return message;
  },

  async updateMessageStatus(id: number, status: 'sent' | 'delivered' | 'read'): Promise<Message | undefined> {
    const [message] = await db.update(messages)
      .set({
        status,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
        readAt: status === 'read' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(messages.id, id))
      .returning();
    
    return message;
  },

  // Group methods
  async createGroup(data: {
    name: string,
    description?: string,
    photoUrl?: string,
    ownerId: number,
    isPublic?: boolean,
    memberIds: number[]
  }): Promise<Group> {
    const [group] = await db.insert(groups)
      .values({
        name: data.name,
        description: data.description,
        photoUrl: data.photoUrl,
        ownerId: data.ownerId,
        isPublic: data.isPublic
      })
      .returning();
    
    // Add owner as admin
    await db.insert(groupMembers)
      .values({
        groupId: group.id,
        userId: data.ownerId,
        role: 'owner'
      });
    
    // Add other members
    if (data.memberIds.length > 0) {
      await db.insert(groupMembers)
        .values(
          data.memberIds
            .filter(id => id !== data.ownerId)
            .map(userId => ({
              groupId: group.id,
              userId,
              role: 'member'
            }))
        );
    }
    
    return group;
  },

  async getGroups(userId: number): Promise<any[]> {
    return db.query.groupMembers.findMany({
      where: eq(groupMembers.userId, userId),
      with: {
        group: {
          with: {
            owner: true,
            members: {
              with: {
                user: true
              }
            },
            messages: {
              limit: 1,
              orderBy: [desc(messages.createdAt)],
              with: {
                sender: true
              }
            }
          }
        }
      },
      orderBy: [desc(groupMembers.updatedAt)]
    });
  },

  // Channel methods
  async createChannel(data: {
    name: string,
    description?: string,
    photoUrl?: string,
    ownerId: number,
    isPublic?: boolean,
    adminIds: number[]
  }): Promise<Channel> {
    const [channel] = await db.insert(channels)
      .values({
        name: data.name,
        description: data.description,
        photoUrl: data.photoUrl,
        ownerId: data.ownerId,
        isPublic: data.isPublic
      })
      .returning();
    
    // Add owner as admin
    await db.insert(channelMembers)
      .values({
        channelId: channel.id,
        userId: data.ownerId,
        role: 'owner'
      });
    
    // Add other admins
    if (data.adminIds.length > 0) {
      await db.insert(channelMembers)
        .values(
          data.adminIds
            .filter(id => id !== data.ownerId)
            .map(userId => ({
              channelId: channel.id,
              userId,
              role: 'admin'
            }))
        );
    }
    
    return channel;
  },

  async getChannels(userId: number): Promise<any[]> {
    return db.query.channelMembers.findMany({
      where: eq(channelMembers.userId, userId),
      with: {
        channel: {
          with: {
            owner: true,
            members: {
              where: eq(channelMembers.role, 'admin'),
              with: {
                user: true
              }
            },
            messages: {
              limit: 1,
              orderBy: [desc(messages.createdAt)],
              with: {
                sender: true
              }
            }
          }
        }
      },
      orderBy: [desc(channelMembers.updatedAt)]
    });
  },

  // Contact methods
  async getContacts(userId: number): Promise<any[]> {
    return db.query.contacts.findMany({
      where: eq(contacts.userId, userId),
      with: {
        contact: true
      }
    });
  },

  async getContactRequests(userId: number): Promise<any[]> {
    return db.query.contactRequests.findMany({
      where: and(
        eq(contactRequests.recipientId, userId),
        eq(contactRequests.status, 'pending')
      ),
      with: {
        sender: true
      }
    });
  },

  async createContactRequest(senderId: number, recipientId: number): Promise<void> {
    // Check if request already exists
    const existingRequest = await db.query.contactRequests.findFirst({
      where: and(
        eq(contactRequests.senderId, senderId),
        eq(contactRequests.recipientId, recipientId)
      )
    });

    if (!existingRequest) {
      await db.insert(contactRequests).values({
        senderId,
        recipientId,
        status: 'pending'
      });
    } else if (existingRequest.status === 'rejected') {
      // If request was rejected before, update it to pending again
      await db.update(contactRequests)
        .set({ status: 'pending', updatedAt: new Date() })
        .where(eq(contactRequests.id, existingRequest.id));
    }
  },

  async acceptContactRequest(requestId: number, userId: number): Promise<void> {
    // Get the request first
    const request = await db.query.contactRequests.findFirst({
      where: and(
        eq(contactRequests.id, requestId),
        eq(contactRequests.recipientId, userId),
        eq(contactRequests.status, 'pending')
      )
    });

    if (!request) {
      throw new Error('Contact request not found');
    }

    // Update request status
    await db.update(contactRequests)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(contactRequests.id, requestId));

    // Add contact relationships both ways
    await this.addContact(userId, request.senderId);
    await this.addContact(request.senderId, userId);
  },

  async rejectContactRequest(requestId: number, userId: number): Promise<void> {
    const request = await db.query.contactRequests.findFirst({
      where: and(
        eq(contactRequests.id, requestId),
        eq(contactRequests.recipientId, userId),
        eq(contactRequests.status, 'pending')
      )
    });

    if (!request) {
      throw new Error('Contact request not found');
    }

    await db.update(contactRequests)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(contactRequests.id, requestId));
  },

  async searchUsers(query: string, currentUserId: number): Promise<any[]> {
    const searchTerm = `%${query}%`;

    // Find users that match the search term
    return db.query.users.findMany({
      where: and(
        or(
          ilike(users.username, searchTerm),
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.email, searchTerm)
        ),
        not(eq(users.id, currentUserId))
      ),
      columns: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicUrl: true,
        status: true
      }
    });
  },

  async addContact(userId: number, contactId: number, nickname?: string): Promise<void> {
    // Check if already exists
    const existingContact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.userId, userId),
        eq(contacts.contactId, contactId)
      )
    });

    if (!existingContact) {
      await db.insert(contacts).values({
        userId,
        contactId,
        nickname
      });
    }
  },

  // Media methods
  async saveMedia(data: {
    messageId?: number,
    uploaderId: number,
    fileUrl: string,
    thumbnailUrl?: string,
    fileName?: string,
    fileSize: number,
    fileType: string,
    width?: number,
    height?: number,
    duration?: number,
    isPublic?: boolean
  }): Promise<any> {
    const [media] = await db.insert(mediaFiles)
      .values(data)
      .returning();
    
    return media;
  },

  // Call methods
  async createCall(data: {
    initiatorId: number,
    conversationId?: number,
    groupId?: number,
    type: 'audio' | 'video'
  }): Promise<any> {
    const [call] = await db.insert(calls)
      .values({
        initiatorId: data.initiatorId,
        conversationId: data.conversationId,
        groupId: data.groupId,
        type: data.type,
        status: 'initiated'
      })
      .returning();
    
    // Add initiator as participant
    await db.insert(callParticipants)
      .values({
        callId: call.id,
        userId: data.initiatorId,
        joinedAt: new Date(),
        hasAudio: true,
        hasVideo: data.type === 'video'
      });
    
    return call;
  },

  async getActiveCallForUser(userId: number): Promise<any | undefined> {
    return db.query.callParticipants.findFirst({
      where: and(
        eq(callParticipants.userId, userId),
        isNull(callParticipants.leftAt)
      ),
      with: {
        call: {
          with: {
            initiator: true,
            participants: {
              with: {
                user: true
              }
            },
            conversation: {
              with: {
                participants: {
                  with: {
                    user: true
                  }
                }
              }
            },
            group: true
          }
        }
      }
    });
  }
};
