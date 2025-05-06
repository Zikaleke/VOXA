import { useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserInitials } from "@/lib/utils";
import { Menu, Phone, Video, MoreVertical, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Conversation, User, UserConversation } from "@/types";
import { initiateCall } from "@/lib/socket";
import { BackgroundImageModal } from "@/components/chat/BackgroundImageModal";

interface ConversationHeaderProps {
  conversation: Conversation;
  recipient?: User;
  isTyping?: boolean;
  onToggleSidebar?: () => void;
}

export function ConversationHeader({ 
  conversation, 
  recipient, 
  isTyping = false,
  onToggleSidebar 
}: ConversationHeaderProps) {
  const isMobile = useMobile();
  const { user } = useAuth();
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  
  const handleAudioCall = () => {
    if (conversation && recipient) {
      initiateCall('audio', conversation.id);
    }
  };
  
  const handleVideoCall = () => {
    if (conversation && recipient) {
      initiateCall('video', conversation.id);
    }
  };
  
  const handleOpenBackgroundModal = () => {
    setShowBackgroundModal(true);
  };
  
  const handleCloseBackgroundModal = () => {
    setShowBackgroundModal(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 flex items-center px-4 py-2">
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>
      )}
      
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
        {recipient?.status === "online" && (
          <span className="online-indicator"></span>
        )}
      </div>
      
      <div className="ml-3 flex-1">
        <h3 className="font-semibold text-gray-800">
          {recipient?.firstName} {recipient?.lastName}
        </h3>
        <p className="text-xs text-gray-500">
          {isTyping ? (
            "Digitando..."
          ) : recipient?.status === "online" ? (
            "Online"
          ) : recipient?.lastSeen ? (
            `Visto por último em ${new Date(recipient.lastSeen).toLocaleDateString()}`
          ) : (
            "Offline"
          )}
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleAudioCall}>
          <Phone className="h-5 w-5 text-gray-600" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleVideoCall}>
          <Video className="h-5 w-5 text-gray-600" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
            <DropdownMenuItem>Silenciar notificações</DropdownMenuItem>
            <DropdownMenuItem>Procurar na conversa</DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenBackgroundModal}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Alterar fundo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Bloquear contato</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {showBackgroundModal && (
        <BackgroundImageModal
          open={showBackgroundModal}
          onClose={handleCloseBackgroundModal}
          conversationId={conversation.id}
          currentBackground={conversation.participants.find(
            (p: UserConversation) => p.userId === user?.id
          )?.backgroundImage}
        />
      )}
    </header>
  );
}
