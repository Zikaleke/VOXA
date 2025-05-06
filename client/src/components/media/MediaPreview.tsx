import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaFile } from "@/types";
import { Play, Pause, X, Send } from "lucide-react";

interface MediaPreviewProps {
  file: File;
  onSend: (caption: string) => void;
  onCancel: () => void;
}

export function MediaPreview({ file, onSend, onCancel }: MediaPreviewProps) {
  const [caption, setCaption] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const fileUrl = URL.createObjectURL(file);
  const fileType = file.type.split("/")[0]; // image, video, audio, etc.

  const handleSend = () => {
    onSend(caption);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const renderPreview = () => {
    switch (fileType) {
      case "image":
        return (
          <img
            src={fileUrl}
            alt="Preview"
            className="w-full rounded-md object-contain max-h-[300px]"
          />
        );
      case "video":
        return (
          <video
            src={fileUrl}
            controls
            className="w-full rounded-md max-h-[300px]"
          />
        );
      case "audio":
        return (
          <div className="flex items-center p-4 bg-gray-100 rounded-md">
            <button
              className="p-2 rounded-full bg-primary text-white mr-3"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-gray-200 rounded">
                <div
                  className="h-1 bg-primary rounded"
                  style={{ width: isPlaying ? "30%" : "0%" }}
                />
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-xs text-gray-600">
                  {file.name.length > 20
                    ? file.name.substring(0, 20) + "..."
                    : file.name}
                </span>
                <span className="text-xs text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center p-4 bg-gray-100 rounded-md">
            <div className="p-3 bg-primary text-white rounded-md mr-3">
              <span className="font-semibold">.{file.name.split(".").pop()}</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-700">
                {file.name.length > 20
                  ? file.name.substring(0, 20) + "..."
                  : file.name}
              </div>
              <div className="text-xs text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Visualização</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPreview()}
        
        <Input
          placeholder="Adicionar legenda..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSend}>
          <Send className="h-4 w-4 mr-2" />
          Enviar
        </Button>
      </CardFooter>
    </Card>
  );
}
