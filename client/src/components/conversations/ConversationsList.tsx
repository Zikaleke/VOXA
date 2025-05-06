import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConversationItem } from "./ConversationItem";
import { Conversation, Message, UserConversation, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationsListProps {
  searchQuery?: string;
}

type ConversationWithRecipient = {
  id: number;
  lastMessage?: Message;
  recipient?: User;
  isOnline: boolean;
  updatedAt: string;
};

export function ConversationsList({ searchQuery = "" }: ConversationsListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithRecipient[]>([]);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

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
        
        return {
          id: conversation.id,
          lastMessage,
          recipient,
          isOnline,
          updatedAt: conversation.updatedAt
        };
      });
      
      // Sort by updated time
      processedConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setConversations(processedConversations);
    }
  }, [data, user]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const recipientName = `${conv.recipient?.firstName || ""} ${conv.recipient?.lastName || ""}`.toLowerCase();
    const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || "";
    
    return recipientName.includes(searchQuery.toLowerCase()) || 
           lastMessageContent.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Erro ao carregar conversas</p>
        <button 
          className="text-sm text-primary mt-2"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    if (searchQuery) {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>Nenhuma conversa encontrada para "{searchQuery}"</p>
        </div>
      );
    }
    
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
        <p>Nenhuma conversa ainda</p>
        <p className="text-sm mt-1">Comece uma nova conversa!</p>
      </div>
    );
  }

  return (
    <div>
      {filteredConversations.map(conversation => (
        <ConversationItem
          key={conversation.id}
          id={conversation.id}
          recipient={conversation.recipient}
          lastMessage={conversation.lastMessage}
          isOnline={conversation.isOnline}
        />
      ))}
    </div>
  );
}

// Using MessageSquare from Lucide React
function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
