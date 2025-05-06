import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { addMessageListener } from '@/lib/socket';
import { Conversation, Message, UserConversation, User } from '@/types';

interface ConversationWithRecipient {
  id: number;
  lastMessage?: Message;
  recipient?: User;
  isOnline: boolean;
  updatedAt: string;
  unreadCount: number;
}

interface ConversationContextProps {
  conversations: ConversationWithRecipient[];
  isLoading: boolean;
  error: any;
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
  getConversationById: (id: number) => ConversationWithRecipient | undefined;
  markAsRead: (conversationId: number) => void;
}

const ConversationContext = createContext<ConversationContextProps | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithRecipient[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!isAuthenticated,
  });

  // Process conversations data when it loads
  useEffect(() => {
    if (data?.conversations) {
      const processedConversations = data.conversations.map((userConv: { conversation: Conversation, user: User }) => {
        const conversation = userConv.conversation;
        
        // Find the last message if any
        const lastMessage = conversation.messages && conversation.messages.length > 0 
          ? conversation.messages[0] 
          : undefined;
        
        // Find the other participant (not the current user)
        const otherParticipants = conversation.participants
          .filter((p: UserConversation) => p.user.id !== user?.id)
          .map((p: UserConversation) => p.user);
        
        const recipient = otherParticipants.length > 0 ? otherParticipants[0] : undefined;
        const isOnline = recipient?.status === "online";
        
        // Find current user's conversation data (for unread count)
        const userConversation = conversation.participants
          .find((p: UserConversation) => p.user.id === user?.id);
        
        // Calculate unread count (would need to compare lastReadAt with message timestamps)
        const unreadCount = 0; // Placeholder
        
        return {
          id: conversation.id,
          lastMessage,
          recipient,
          isOnline,
          updatedAt: conversation.updatedAt,
          unreadCount
        };
      });
      
      // Sort by updated time
      processedConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setConversations(processedConversations);
    }
  }, [data, user]);
  
  // Listen for new messages to update conversations
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const removeListener = addMessageListener((message) => {
      if (message.type === "message") {
        // Trigger a refetch of conversations to update the list
        // Alternatively, update the specific conversation in the state
      } else if (message.type === "presence") {
        // Update online status of contacts
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv.recipient?.id === message.payload.userId) {
              return {
                ...conv,
                isOnline: message.payload.status === "online"
              };
            }
            return conv;
          })
        );
      }
    });
    
    return () => {
      removeListener();
    };
  }, [isAuthenticated]);
  
  const getConversationById = (id: number) => {
    return conversations.find(conv => conv.id === id);
  };
  
  const markAsRead = (conversationId: number) => {
    // Update local state to mark conversation as read
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unreadCount: 0
          };
        }
        return conv;
      })
    );
    
    // Would also need to update on the server via API
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        isLoading,
        error,
        activeConversationId,
        setActiveConversationId,
        getConversationById,
        markAsRead
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
};
