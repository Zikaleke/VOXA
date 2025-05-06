import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { MessageList } from "@/components/conversations/MessageList";
import { MessageInput } from "@/components/layout/MessageInput";
import { ConversationHeader } from "@/components/layout/ConversationHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { CallScreen } from "@/components/calls/CallScreen";
import { addMessageListener } from "@/lib/socket";
import { PendingMessage, User, Conversation, Call } from "@/types";
import { useMobile } from "@/hooks/use-mobile";

export default function ConversationPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ id: string }>("/chat/:id");
  const conversationId = params?.id ? parseInt(params.id) : null;
  const isMobile = useMobile();
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Fetch conversation data
  const { data: conversationData, isLoading: isConversationLoading } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId && isAuthenticated,
  });
  
  const conversation: Conversation | undefined = conversationData?.conversation;
  
  // Find the other participant (recipient)
  const recipient: User | undefined = conversation?.participants?.find(
    p => p.user?.id !== user?.id
  )?.user;
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Listen for incoming messages and typing indicators
  useEffect(() => {
    if (!isAuthenticated || !conversationId) return;
    
    const removeListener = addMessageListener((message) => {
      if (message.type === "message" && message.payload.message?.conversationId === conversationId) {
        // This is handled by the MessageList component which will refetch when necessary
      } else if (message.type === "typing" && 
                message.payload.conversationId === conversationId && 
                message.payload.userId !== user?.id) {
        
        // Set typing indicator
        setIsTyping(message.payload.isTyping);
        
        // Clear previous timeout if exists
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        // Set a timeout to clear typing indicator after 3 seconds
        // (in case we miss the "stopped typing" event)
        if (message.payload.isTyping) {
          const timeout = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
          setTypingTimeout(timeout);
        }
      } else if (message.type === "call" && message.payload.action === "incoming") {
        // Handle incoming call
        // This would typically show a call UI with accept/decline options
        console.log("Incoming call", message.payload);
      }
    });
    
    return () => {
      removeListener();
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [conversationId, isAuthenticated, user?.id, typingTimeout]);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  
  const handleEndCall = () => {
    setActiveCall(null);
  };
  
  const handleMessageSent = (tempId: string) => {
    // Add pending message to list
    const newPendingMessage: PendingMessage = {
      tempId,
      senderId: user?.id || 0,
      conversationId: conversationId || undefined,
      content: "",
      type: "text",
      status: "sending",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    setPendingMessages(prev => [...prev, newPendingMessage]);
  };
  
  const handleRemovePendingMessage = (tempId: string) => {
    setPendingMessages(prev => prev.filter(msg => msg.tempId !== tempId));
  };

  if (isLoading || isConversationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {(isSidebarVisible || !isMobile) && <Sidebar />}
      
      <main className="flex-1 flex flex-col h-full">
        {recipient && conversation && (
          <>
            <ConversationHeader 
              conversation={conversation} 
              recipient={recipient} 
              isTyping={isTyping}
              onToggleSidebar={toggleSidebar} 
            />
            
            <MessageList 
              conversationId={conversationId || 0} 
              pendingMessages={pendingMessages}
              onRemovePendingMessage={handleRemovePendingMessage}
            />
            
            <MessageInput 
              conversationId={conversationId || 0} 
              onMessageSent={handleMessageSent} 
            />
          </>
        )}
      </main>
      
      <MobileNavigation />
      
      {activeCall && recipient && (
        <CallScreen 
          call={activeCall} 
          recipient={recipient} 
          onEndCall={handleEndCall} 
        />
      )}
    </div>
  );
}
