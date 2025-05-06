import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageItem } from "./MessageItem";
import { Conversation, Message, PendingMessage, User } from "@/types";
import { formatMessageDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { updateMessageStatus } from "@/lib/socket";

interface MessageListProps {
  conversationId: number;
  pendingMessages: PendingMessage[];
  onRemovePendingMessage: (tempId: string) => void;
}

interface GroupedMessages {
  [date: string]: (Message | PendingMessage)[];
}

export function MessageList({ 
  conversationId, 
  pendingMessages, 
  onRemovePendingMessage 
}: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages>({});
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
  });
  
  // Group messages by date
  useEffect(() => {
    if (data?.messages) {
      const combined = [...data.messages, ...pendingMessages];
      const grouped = combined.reduce((acc: GroupedMessages, message) => {
        const date = new Date(message.sentAt || message.createdAt);
        const dateKey = formatMessageDate(date.toISOString());
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        // Mark received messages as read
        if ('id' in message && 
            message.senderId !== user?.id && 
            (message.status === 'sent' || message.status === 'delivered')) {
          updateMessageStatus(message.id, 'read');
        }
        
        // Add message to the group
        acc[dateKey].push(message);
        
        return acc;
      }, {});
      
      // Sort messages within each group by sentAt/createdAt
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
          const aDate = new Date(a.sentAt || a.createdAt);
          const bDate = new Date(b.sentAt || b.createdAt);
          return aDate.getTime() - bDate.getTime();
        });
      });
      
      setGroupedMessages(grouped);
    }
  }, [data, pendingMessages, user]);
  
  // Scroll to bottom on initial load or when new messages arrive
  useEffect(() => {
    if (!isLoading && messagesEndRef.current && !hasScrolledToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setHasScrolledToBottom(true);
    }
  }, [groupedMessages, isLoading, hasScrolledToBottom]);
  
  // Scroll to bottom when a new pending message is added
  useEffect(() => {
    if (pendingMessages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [pendingMessages.length]);
  
  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full mr-3" />}
            <div>
              <Skeleton className={`h-20 w-48 ${i % 2 === 0 ? 'rounded-[12px_12px_0_12px]' : 'rounded-[12px_12px_12px_0]'}`} />
              <Skeleton className="h-3 w-16 mt-1 ml-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Erro ao carregar mensagens</p>
          <button 
            className="text-sm text-primary mt-2"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  
  if (Object.keys(groupedMessages).length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm mt-1">Seja o primeiro a enviar uma mensagem!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50">
      {Object.keys(groupedMessages).map(date => (
        <div key={date}>
          {/* Date Divider */}
          <div className="flex justify-center my-4">
            <span className="text-xs text-gray-500 bg-gray-100 px-4 py-1 rounded-full">
              {date}
            </span>
          </div>
          
          {/* Messages */}
          {groupedMessages[date].map((message, index) => {
            const isCurrentUser = 
              'senderId' in message 
                ? message.senderId === user?.id 
                : message.tempId ? true : false;
            
            return (
              <MessageItem
                key={'id' in message ? message.id : message.tempId}
                message={message}
                isCurrentUser={isCurrentUser}
                showAvatar={!isCurrentUser}
                onMessageConfirmed={'tempId' in message ? () => onRemovePendingMessage(message.tempId) : undefined}
              />
            );
          })}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
