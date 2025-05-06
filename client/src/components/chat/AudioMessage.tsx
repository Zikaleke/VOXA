import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  audioUrl: string;
  isOwn: boolean;
}

export function AudioMessage({ audioUrl, isOwn }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setDuration(audio.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSliderChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "flex items-center p-2 rounded-lg max-w-xs space-x-2",
      isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
    )}>
      <audio 
        ref={audioRef} 
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
      
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlayPause}
        className={cn(
          "h-8 w-8",
          isOwn ? "hover:bg-primary/90 text-primary-foreground" : "hover:bg-muted/90"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex-1 flex flex-col min-w-[120px]">
        <div className="flex justify-between text-xs mb-1">
          <Volume2 className="h-3 w-3" />
          <span>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        </div>
        
        <Slider
          defaultValue={[0]}
          max={duration || 100}
          step={0.1}
          value={[currentTime]}
          onValueChange={handleSliderChange}
          className={cn(
            isOwn ? "[&>span]:bg-primary-foreground" : "[&>span]:bg-primary"
          )}
        />
      </div>
    </div>
  );
}
