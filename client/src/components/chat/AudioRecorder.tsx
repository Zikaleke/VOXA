import React, { useState, useRef } from 'react';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AudioRecorderProps {
  conversationId: number;
  onAudioSent: () => void;
}

export function AudioRecorder({ conversationId, onAudioSent }: AudioRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        // Auto stop after 1 minute
        if (seconds >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar o microfone. Verifique as permissões.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      // Upload the audio file
      const uploadResponse = await apiRequest('POST', '/api/media/upload', formData, true);
      const uploadData = await uploadResponse.json();

      if (uploadData.url) {
        // Send the message with the audio URL
        await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
          content: uploadData.url,
          type: "audio"
        });

        // Clear the recorded audio
        setAudioBlob(null);
        setRecordingTime(0);
        onAudioSent();

        toast({
          title: 'Mensagem de áudio enviada',
          description: 'Sua mensagem de áudio foi enviada com sucesso.'
        });
      }
    } catch (error) {
      console.error('Error sending audio message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem de áudio.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording && !audioBlob ? (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={startRecording} 
          type="button" 
          className="text-gray-500 hover:text-primary"
        >
          <Mic className="h-5 w-5" />
        </Button>
      ) : isRecording ? (
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-destructive animate-pulse">
            {formatTime(recordingTime)}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={stopRecording} 
            type="button" 
            className="text-destructive hover:text-destructive/80"
          >
            <Square className="h-5 w-5" />
          </Button>
        </div>
      ) : audioBlob ? (
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium">
            {formatTime(recordingTime)}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={cancelRecording} 
            type="button" 
            className="text-destructive hover:text-destructive/80"
          >
            <Square className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={sendAudio} 
            type="button" 
            className="text-primary hover:text-primary/80"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
