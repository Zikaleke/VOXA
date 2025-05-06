import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, User } from "@/types";
import { getUserInitials, formatConversationTime, truncateText } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface ConversationItemProps {
  id: number;
  recipient?: User;
  lastMessage?: Message;
  isOnline: boolean;
  isSelected?: boolean;
}

export function ConversationItem({ 
  id, 
  recipient, 
  lastMessage, 
  isOnline,
  isSelected = false
}: ConversationItemProps) {
  // Get message status icon
  const getStatusIcon = () => {
    if (!lastMessage || lastMessage.senderId !== recipient?.id) {
      switch (lastMessage?.status) {
        case 'sent':
          return <Check className="text-gray-400 text-xs" />;
        case 'delivered':
          return <CheckCheck className="text-gray-400 text-xs" />;
        case 'read':
          return <CheckCheck className="text-info text-xs" />;
        default:
          return null;
      }
    }
    return null;
  };
  
  // Format last message preview
  const getMessagePreview = () => {
    if (!lastMessage) return "Nenhuma mensagem";
    
    switch (lastMessage.type) {
      case 'image':
        return "📷 Foto";
      case 'video':
        return "🎥 Vídeo";
      case 'audio':
        return "🎵 Áudio";
      case 'file':
        return "📎 Arquivo";
      case 'location':
        return "📍 Localização";
      case 'contact':
        return "👤 Contato";
      default:
        return truncateText(lastMessage.content || "", 40);
    }
  };

  return (
    <Link href={`/chat/${id}`}>
      <div className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center ${isSelected ? 'bg-gray-50' : ''}`}>
        <div className="relative">
          <Avatar>
            {recipient?.profilePicUrl ? (
              <AvatarImage src={recipient.profilePicUrl} alt={`Foto de ${recipient.firstName}`} />
            ) : (
              <AvatarFallback className="bg-primary text-white">
                {getUserInitials(recipient?.firstName || "", recipient?.lastName)}
              </AvatarFallback>
            )}
          </Avatar>
          {isOnline && <span className="online-indicator"></span>}
        </div>
        
        <div className="ml-3 flex-1 overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">
              {recipient?.firstName} {recipient?.lastName}
            </h3>
            <span className="text-xs text-gray-400">
              {lastMessage ? formatConversationTime(lastMessage.sentAt) : ""}
            </span>
          </div>
          
          <div className="flex items-center">
            {getStatusIcon()}
            <p className={`text-sm ${getStatusIcon() ? 'ml-1' : ''} text-gray-600 truncate`}>
              {getMessagePreview()}
            </p>
            
            {/* Unread badge would go here */}
          </div>
        </div>
      </div>
    </Link>
  );
}
