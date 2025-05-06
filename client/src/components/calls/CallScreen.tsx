import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Call } from "@/types";
import { getUserInitials } from "@/lib/utils";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Monitor } from "lucide-react";

interface CallScreenProps {
  call: Call;
  recipient: User;
  onEndCall: () => void;
}

export function CallScreen({ call, recipient, onEndCall }: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.type === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Handle call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format call duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Card className="w-52 shadow-lg">
          <CardContent className="p-3 flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              {recipient.profilePicUrl ? (
                <AvatarImage src={recipient.profilePicUrl} alt={`Foto de ${recipient.firstName}`} />
              ) : (
                <AvatarFallback className="bg-primary text-white">
                  {getUserInitials(recipient.firstName, recipient.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium">{recipient.firstName}</div>
              <div className="text-xs text-emerald-600">{formatDuration(callDuration)}</div>
            </div>
            <Button 
              size="icon" 
              variant="ghost"
              className="h-8 w-8" 
              onClick={toggleMinimize}
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="p-6 flex flex-col items-center">
          {call.type === "video" && isVideoEnabled ? (
            <div className="relative w-full h-[300px] bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-white text-opacity-70">Vídeo indisponível</div>
              <div className="absolute top-3 right-3 h-24 w-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                {/* Self preview would go here */}
              </div>
            </div>
          ) : (
            <Avatar className="h-24 w-24 mb-4">
              {recipient.profilePicUrl ? (
                <AvatarImage src={recipient.profilePicUrl} alt={`Foto de ${recipient.firstName}`} />
              ) : (
                <AvatarFallback className="bg-primary text-white text-3xl">
                  {getUserInitials(recipient.firstName, recipient.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
          )}
          
          <h2 className="text-2xl font-bold mb-1">
            {recipient.firstName} {recipient.lastName}
          </h2>
          
          <div className="text-emerald-600 font-medium mb-6">
            {formatDuration(callDuration)}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              className="rounded-full flex flex-col items-center p-3 h-auto"
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6 mb-1" />
              ) : (
                <Mic className="h-6 w-6 mb-1" />
              )}
              <span className="text-xs">Mudo</span>
            </Button>
            
            {call.type === "video" && (
              <Button
                variant={!isVideoEnabled ? "destructive" : "outline"}
                size="lg"
                className="rounded-full flex flex-col items-center p-3 h-auto"
                onClick={toggleVideo}
              >
                {!isVideoEnabled ? (
                  <VideoOff className="h-6 w-6 mb-1" />
                ) : (
                  <Video className="h-6 w-6 mb-1" />
                )}
                <span className="text-xs">Vídeo</span>
              </Button>
            )}
            
            <Button
              variant={!isSpeakerOn ? "destructive" : "outline"}
              size="lg"
              className="rounded-full flex flex-col items-center p-3 h-auto"
              onClick={toggleSpeaker}
            >
              <Volume2 className="h-6 w-6 mb-1" />
              <span className="text-xs">Alto-falante</span>
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center p-6 pt-0">
          <Button 
            variant="ghost" 
            onClick={toggleMinimize}
          >
            <Monitor className="h-5 w-5 mr-2" />
            Minimizar
          </Button>
          
          <Button 
            variant="destructive" 
            size="lg" 
            className="rounded-full h-16 w-16"
            onClick={onEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          <div className="w-20" />
        </CardFooter>
      </Card>
    </div>
  );
}
