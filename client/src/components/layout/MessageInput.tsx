import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Send, Mic, Image, File, MapPin, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendMessage, sendTypingIndicator } from "@/lib/socket";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioRecorder } from "@/components/chat/AudioRecorder";

interface MessageInputProps {
  conversationId: number;
  onMessageSent: (tempId: string) => void;
}

export function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerText.trim();
    setMessage(content);
    
    // Send typing indicator
    if (content.length > 0) {
      sendTypingIndicator(conversationId, undefined, true);
      
      // Reset the typing indicator after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(conversationId, undefined, false);
      }, 3000);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingIndicator(conversationId, undefined, false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const pendingMessage = sendMessage(message, conversationId);
      if (pendingMessage) {
        onMessageSent(pendingMessage.tempId);
        
        // Clear input
        if (inputRef.current) {
          inputRef.current.innerText = "";
        }
        setMessage("");
        
        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        sendTypingIndicator(conversationId, undefined, false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachment = (type: string) => {
    // Placeholder for attachment handling
    console.log(`Attachment type selected: ${type}`);
  };

  useEffect(() => {
    // Clean up typing indicator timeout on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        sendTypingIndicator(conversationId, undefined, false);
      }
    };
  }, [conversationId]);

  return (
    <div className="bg-white border-t border-gray-200 p-3 flex items-end">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full mr-2 text-gray-600">
              <Smile className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Emojis</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full mr-2 text-gray-600">
                  <Paperclip className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Anexar arquivo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent side="top" align="start">
          <DropdownMenuItem onClick={() => handleAttachment("image")}>
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachment("document")}>
            <File className="h-4 w-4 mr-2" />
            Documento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachment("location")}>
            <MapPin className="h-4 w-4 mr-2" />
            Localização
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAttachment("contact")}>
            <User className="h-4 w-4 mr-2" />
            Contato
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div 
        className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-primary min-h-[40px] max-h-[120px] overflow-y-auto"
        onClick={() => inputRef.current?.focus()}
      >
        <div 
          ref={inputRef}
          contentEditable
          className="outline-none break-words"
          data-placeholder="Digite uma mensagem..."
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
          role="textbox"
        />
      </div>

      {isRecording ? (
        <AudioRecorder 
          conversationId={conversationId} 
          onAudioSent={() => {
            setIsRecording(false);
            onMessageSent('audio-message');
          }} 
        />
      ) : message.trim() ? (
        <Button 
          size="icon" 
          className="ml-2 rounded-full" 
          onClick={handleSendMessage}
        >
          <Send className="h-5 w-5" />
        </Button>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 rounded-full bg-primary text-white"
                onClick={() => setIsRecording(true)}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gravar áudio</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
