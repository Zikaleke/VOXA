import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, PendingMessage, User } from "@/types";
import { formatMessageTime, getUserInitials } from "@/lib/utils";
import { Check, CheckCheck, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MessageItemProps {
  message: Message | PendingMessage;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  sender?: User;
  onMessageConfirmed?: () => void;
}

export function MessageItem({ 
  message, 
  isCurrentUser, 
  showAvatar = true,
  sender,
  onMessageConfirmed
}: MessageItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Get message status icon
  const getStatusIcon = () => {
    if (!isCurrentUser) return null;
    
    if ('status' in message) {
      switch (message.status) {
        case 'sending':
          return <Check className="text-gray-400 text-sm" />;
        case 'sent':
          return <Check className="text-gray-400 text-sm" />;
        case 'delivered':
          return <CheckCheck className="text-gray-400 text-sm" />;
        case 'read':
          return <CheckCheck className="text-info text-sm" />;
        default:
          return null;
      }
    }
    return null;
  };
  
  // Handle media playback for audio messages
  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Determine message content based on type
  const renderMessageContent = () => {
    if ('content' in message && message.content) {
      return <p className="text-gray-800">{message.content}</p>;
    }
    
    if ('type' in message && message.type === 'audio') {
      return (
        <div className="flex items-center">
          <button 
            className="p-2 rounded-full bg-primary text-white mr-3"
            onClick={handlePlayAudio}
          >
            <Play className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <Progress value={isPlaying ? 30 : 0} className="h-1" />
            <div className="text-xs text-gray-600 mt-1">0:42</div>
          </div>
        </div>
      );
    }
    
    if ('type' in message && message.type === 'image' && 'media' in message && message.media && message.media.length > 0) {
      return (
        <img 
          src={message.media[0].fileUrl} 
          alt="Imagem" 
          className="rounded-lg w-full max-w-[240px]" 
        />
      );
    }
    
    return <p className="text-gray-800 italic">Mensagem sem conteúdo</p>;
  };
  
  // If message is confirmed (from pending to real), call the onMessageConfirmed
  if ('tempId' in message && onMessageConfirmed && 'id' in message) {
    onMessageConfirmed();
  }

  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : ''}`}>
      {showAvatar && !isCurrentUser && (
        <div className="flex-shrink-0 mr-3">
          <Avatar className="h-8 w-8">
            {sender?.profilePicUrl ? (
              <AvatarImage src={sender.profilePicUrl} alt={`Foto de ${sender.firstName}`} />
            ) : (
              <AvatarFallback className="bg-primary text-white text-xs">
                {getUserInitials(sender?.firstName || "", sender?.lastName)}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      )}
      
      <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : ''}`}>
        <div className={isCurrentUser ? "message-out p-3 shadow-sm" : "message-in p-3 shadow-sm"}>
          {renderMessageContent()}
        </div>
        
        <div className={`flex items-center mt-1 ${isCurrentUser ? 'justify-end mr-1' : 'ml-1'}`}>
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.sentAt || message.createdAt)}
          </span>
          {getStatusIcon() && (
            <span className="ml-1">{getStatusIcon()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
