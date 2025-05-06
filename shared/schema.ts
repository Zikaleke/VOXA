import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Enums
export const userStatusEnum = pgEnum('user_status', ['online', 'offline', 'away']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'video', 'audio', 'file', 'location', 'contact']);
export const messageStatusEnum = pgEnum('message_status', ['sending', 'sent', 'delivered', 'read', 'failed']);
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);
export const channelRoleEnum = pgEnum('channel_role', ['owner', 'admin', 'subscriber']);
export const callTypeEnum = pgEnum('call_type', ['audio', 'video']);
export const callStatusEnum = pgEnum('call_status', ['initiated', 'ongoing', 'ended', 'missed', 'rejected']);
export const contactRequestStatusEnum = pgEnum('contact_request_status', ['pending', 'accepted', 'rejected']);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  phoneNumber: text('phone_number'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  bio: text('bio'),
  profilePicUrl: text('profile_pic_url'),
  status: userStatusEnum('status').default('offline'),
  lastSeen: timestamp('last_seen'),
  isVerified: boolean('is_verified').default(false),
  verificationCode: text('verification_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User settings
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').default('light'),
  notificationEnabled: boolean('notification_enabled').default(true),
  messagePreview: boolean('message_preview').default(true),
  lastSeenVisible: boolean('last_seen_visible').default(true),
  profilePhotoVisible: boolean('profile_photo_visible').default(true),
  readReceiptsEnabled: boolean('read_receipts_enabled').default(true),
  language: text('language').default('pt-BR'),
  fontSize: integer('font_size').default(14),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Sessions
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  device: text('device'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Device Tokens for push notifications
export const deviceTokens = pgTable('device_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  device: text('device'),
  platform: text('platform'), // "android", "ios", "web"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Contacts
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nickname: text('nickname'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Contact requests
export const contactRequests = pgTable('contact_requests', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: contactRequestStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Blocked users
export const blockedUsers = pgTable('blocked_users', {
  id: serial('id').primaryKey(),
  blockerId: integer('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: integer('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Conversations (1:1)
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// User conversation relationship
export const userConversations = pgTable('user_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  lastReadAt: timestamp('last_read_at'),
  isArchived: boolean('is_archived').default(false),
  isPinned: boolean('is_pinned').default(false),
  isMuted: boolean('is_muted').default(false),
  muteExpiresAt: timestamp('mute_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Groups
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  photoUrl: text('photo_url'),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  isPublic: boolean('is_public').default(false),
  inviteLink: text('invite_link').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Group members
export const groupMembers = pgTable('group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').default('member'),
  lastReadAt: timestamp('last_read_at'),
  isArchived: boolean('is_archived').default(false),
  isPinned: boolean('is_pinned').default(false),
  isMuted: boolean('is_muted').default(false),
  muteExpiresAt: timestamp('mute_expires_at'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Channels
export const channels = pgTable('channels', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  photoUrl: text('photo_url'),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  isPublic: boolean('is_public').default(false),
  inviteLink: text('invite_link').unique(),
  subscriberCount: integer('subscriber_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Channel members
export const channelMembers = pgTable('channel_members', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: channelRoleEnum('role').default('subscriber'),
  lastReadAt: timestamp('last_read_at'),
  isArchived: boolean('is_archived').default(false),
  isPinned: boolean('is_pinned').default(false),
  isMuted: boolean('is_muted').default(false),
  muteExpiresAt: timestamp('mute_expires_at'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  recipientId: integer('recipient_id').references(() => users.id),
  conversationId: integer('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  groupId: integer('group_id').references(() => groups.id, { onDelete: 'set null' }),
  channelId: integer('channel_id').references(() => channels.id, { onDelete: 'set null' }),
  content: text('content'),
  type: messageTypeEnum('type').default('text'),
  replyToId: integer('reply_to_id').references(() => messages.id, { onDelete: 'set null' }),
  forwardFromId: integer('forward_from_id').references(() => messages.id, { onDelete: 'set null' }),
  selfDestructTime: integer('self_destruct_time'),
  expiresAt: timestamp('expires_at'),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  viewCount: integer('view_count').default(0),
  status: messageStatusEnum('status').default('sending'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Media files
export const mediaFiles = pgTable('media_files', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  uploaderId: integer('uploader_id').notNull().references(() => users.id),
  fileUrl: text('file_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Message reactions
export const messageReactions = pgTable('message_reactions', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Calls
export const calls = pgTable('calls', {
  id: serial('id').primaryKey(),
  initiatorId: integer('initiator_id').notNull().references(() => users.id),
  conversationId: integer('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  groupId: integer('group_id').references(() => groups.id, { onDelete: 'set null' }),
  type: callTypeEnum('type').default('audio'),
  status: callStatusEnum('status').default('initiated'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Call participants
export const callParticipants = pgTable('call_participants', {
  id: serial('id').primaryKey(),
  callId: integer('call_id').notNull().references(() => calls.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at'),
  leftAt: timestamp('left_at'),
  hasVideo: boolean('has_video').default(false),
  hasAudio: boolean('has_audio').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: json('data'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  sentMessages: many(messages, { relationName: 'sentMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
  ownedConversations: many(conversations, { relationName: 'conversationOwner' }),
  userConversations: many(userConversations),
  ownedGroups: many(groups, { relationName: 'groupOwner' }),
  groupMemberships: many(groupMembers),
  ownedChannels: many(channels, { relationName: 'channelOwner' }),
  channelMemberships: many(channelMembers),
  initiatedCalls: many(calls, { relationName: 'callInitiator' }),
  callParticipations: many(callParticipants),
  contacts: many(contacts, { relationName: 'userContacts' }),
  contactOf: many(contacts, { relationName: 'contactOf' }),
  sentContactRequests: many(contactRequests, { relationName: 'requestSender' }),
  receivedContactRequests: many(contactRequests, { relationName: 'requestRecipient' }),
  blockedUsers: many(blockedUsers, { relationName: 'blockingUser' }),
  blockedBy: many(blockedUsers, { relationName: 'blockedUser' }),
  settings: one(userSettings),
  notifications: many(notifications),
  mediaFiles: many(mediaFiles, { relationName: 'uploadedMedia' }),
  sessions: many(sessions),
  deviceTokens: many(deviceTokens)
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id]
  })
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  participants: many(userConversations),
  messages: many(messages),
  calls: many(calls),
  creator: one(users, {
    fields: [conversations.creatorId],
    references: [users.id],
    relationName: 'conversationOwner'
  })
}));

export const userConversationsRelations = relations(userConversations, ({ one }) => ({
  user: one(users, {
    fields: [userConversations.userId],
    references: [users.id]
  }),
  conversation: one(conversations, {
    fields: [userConversations.conversationId],
    references: [conversations.id]
  })
}));

export const groupsRelations = relations(groups, ({ many, one }) => ({
  members: many(groupMembers),
  messages: many(messages),
  calls: many(calls),
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
    relationName: 'groupOwner'
  })
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id]
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id]
  })
}));

export const channelsRelations = relations(channels, ({ many, one }) => ({
  members: many(channelMembers),
  messages: many(messages),
  owner: one(users, {
    fields: [channels.ownerId],
    references: [users.id],
    relationName: 'channelOwner'
  })
}));

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMembers.channelId],
    references: [channels.id]
  }),
  user: one(users, {
    fields: [channelMembers.userId],
    references: [users.id]
  })
}));

export const messagesRelations = relations(messages, ({ many, one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sentMessages'
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: 'receivedMessages'
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id]
  }),
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id]
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id]
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
    relationName: 'messageReplies'
  }),
  replies: many(messages, { relationName: 'messageReplies' }),
  forwardFrom: one(messages, {
    fields: [messages.forwardFromId],
    references: [messages.id],
    relationName: 'messageForwards'
  }),
  forwards: many(messages, { relationName: 'messageForwards' }),
  media: many(mediaFiles),
  reactions: many(messageReactions)
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  message: one(messages, {
    fields: [mediaFiles.messageId],
    references: [messages.id]
  }),
  uploader: one(users, {
    fields: [mediaFiles.uploaderId],
    references: [users.id],
    relationName: 'uploadedMedia'
  })
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id]
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id]
  })
}));

export const callsRelations = relations(calls, ({ many, one }) => ({
  initiator: one(users, {
    fields: [calls.initiatorId],
    references: [users.id],
    relationName: 'callInitiator'
  }),
  conversation: one(conversations, {
    fields: [calls.conversationId],
    references: [conversations.id]
  }),
  group: one(groups, {
    fields: [calls.groupId],
    references: [groups.id]
  }),
  participants: many(callParticipants)
}));

export const callParticipantsRelations = relations(callParticipants, ({ one }) => ({
  call: one(calls, {
    fields: [callParticipants.callId],
    references: [calls.id]
  }),
  user: one(users, {
    fields: [callParticipants.userId],
    references: [users.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
    relationName: 'userContacts'
  }),
  contact: one(users, {
    fields: [contacts.contactId],
    references: [users.id],
    relationName: 'contactOf'
  })
}));

export const contactRequestsRelations = relations(contactRequests, ({ one }) => ({
  sender: one(users, {
    fields: [contactRequests.senderId],
    references: [users.id],
    relationName: 'requestSender'
  }),
  recipient: one(users, {
    fields: [contactRequests.recipientId],
    references: [users.id],
    relationName: 'requestRecipient'
  })
}));

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  blocker: one(users, {
    fields: [blockedUsers.blockerId],
    references: [users.id],
    relationName: 'blockingUser'
  }),
  blocked: one(users, {
    fields: [blockedUsers.blockedId],
    references: [users.id],
    relationName: 'blockedUser'
  })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));

export const deviceTokensRelations = relations(deviceTokens, ({ one }) => ({
  user: one(users, {
    fields: [deviceTokens.userId],
    references: [users.id]
  })
}));

// Schemas for validation
export const userInsertSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Email inválido"),
  username: (schema) => schema.min(3, "Username deve ter pelo menos 3 caracteres"),
  password: (schema) => schema.min(6, "Senha deve ter pelo menos 6 caracteres"),
  firstName: (schema) => schema.min(2, "Nome deve ter pelo menos 2 caracteres")
});

export const userLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

export const userRegisterSchema = userInsertSchema.pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().min(6, "Código inválido")
});

export const messageInsertSchema = createInsertSchema(messages);
export const conversationInsertSchema = createInsertSchema(conversations);
export const groupInsertSchema = createInsertSchema(groups);
export const channelInsertSchema = createInsertSchema(channels);

// Types
export type User = typeof users.$inferSelect;
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type Message = typeof messages.$inferSelect;
export type MessageInsert = z.infer<typeof messageInsertSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationInsert = z.infer<typeof conversationInsertSchema>;
export type Group = typeof groups.$inferSelect;
export type GroupInsert = z.infer<typeof groupInsertSchema>;
export type Channel = typeof channels.$inferSelect;
export type ChannelInsert = z.infer<typeof channelInsertSchema>;
