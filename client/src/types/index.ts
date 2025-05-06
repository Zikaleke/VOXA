// User types
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName?: string;
  bio?: string;
  profilePicUrl?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  isVerified: boolean;
}

export interface UserSettings {
  id: number;
  userId: number;
  theme: string;
  notificationEnabled: boolean;
  messagePreview: boolean;
  lastSeenVisible: boolean;
  profilePhotoVisible: boolean;
  readReceiptsEnabled: boolean;
  language: string;
  fontSize: number;
}

// Authentication types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  username: string;
  firstName: string;
  lastName?: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Message types
export interface Message {
  id: number;
  senderId: number;
  recipientId?: number;
  conversationId?: number;
  groupId?: number;
  channelId?: number;
  content?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  replyToId?: number;
  replyTo?: Message;
  forwardFromId?: number;
  forwardFrom?: Message;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  media?: MediaFile[];
  reactions?: MessageReaction[];
  sender?: User;
}

export interface PendingMessage {
  tempId: string;
  senderId: number;
  conversationId?: number;
  groupId?: number;
  channelId?: number;
  content?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  replyToId?: number;
  status: 'sending';
  sentAt: string;
  createdAt: string;
}

// Conversation types
export interface Conversation {
  id: number;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  participants: UserConversation[];
  messages: Message[];
}

export interface UserConversation {
  id: number;
  userId: number;
  conversationId: number;
  lastReadAt?: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  muteExpiresAt?: string;
  user: User;
}

// Group types
export interface Group {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  ownerId: number;
  isPublic: boolean;
  inviteLink?: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  messages: Message[];
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'owner' | 'admin' | 'member';
  lastReadAt?: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  muteExpiresAt?: string;
  joinedAt: string;
  updatedAt: string;
  user: User;
}

// Channel types
export interface Channel {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  ownerId: number;
  isPublic: boolean;
  inviteLink?: string;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
  members: ChannelMember[];
  messages: Message[];
}

export interface ChannelMember {
  id: number;
  channelId: number;
  userId: number;
  role: 'owner' | 'admin' | 'subscriber';
  lastReadAt?: string;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  muteExpiresAt?: string;
  joinedAt: string;
  updatedAt: string;
  user: User;
}

// Media types
export interface MediaFile {
  id: number;
  messageId?: number;
  uploaderId: number;
  fileUrl: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize: number;
  fileType: string;
  width?: number;
  height?: number;
  duration?: number;
  isPublic: boolean;
  createdAt: string;
}

export interface MessageReaction {
  id: number;
  messageId: number;
  userId: number;
  emoji: string;
  createdAt: string;
  user: User;
}

// Call types
export interface Call {
  id: number;
  initiatorId: number;
  conversationId?: number;
  groupId?: number;
  type: 'audio' | 'video';
  status: 'initiated' | 'ongoing' | 'ended' | 'missed' | 'rejected';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  participants: CallParticipant[];
  initiator: User;
}

export interface CallParticipant {
  id: number;
  callId: number;
  userId: number;
  joinedAt?: string;
  leftAt?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  createdAt: string;
  user: User;
}

// Contact types
export interface Contact {
  id: number;
  userId: number;
  contactId: number;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
  contact: User;
}

// Notification types
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// WebSocket message types
export interface SocketMessage {
  type: string;
  payload: any;
}
