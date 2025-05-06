import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface BackgroundImageModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: number;
  currentBackground?: string;
}

export function BackgroundImageModal({
  open,
  onClose,
  conversationId,
  currentBackground
}: BackgroundImageModalProps) {
  const [selectedTab, setSelectedTab] = useState<string>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBackground || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Mutação para atualizar a imagem de fundo
  const updateBackgroundMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/conversations/${conversationId}/background`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao fazer upload');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate query to refresh conversation data
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      toast({
        title: "Fundo atualizado",
        description: "O fundo da conversa foi atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar fundo:", error);
      toast({
        title: "Erro ao atualizar fundo",
        description: "Não foi possível atualizar o fundo da conversa.",
        variant: "destructive",
      });
    },
  });

  // Manipulador para mudança de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Criar URL para preview
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Manipulador para envio de formulário
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedFile) {
      updateBackgroundMutation.mutate(selectedFile);
    }
  };

  // Manipulador para clicar no botão de upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar fundo da conversa</DialogTitle>
          <DialogDescription>
            Escolha uma imagem para o fundo desta conversa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG ou GIF (Max. 5MB)</p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!selectedFile || updateBackgroundMutation.isPending}
                >
                  {updateBackgroundMutation.isPending ? "Atualizando..." : "Atualizar fundo"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="preview" className="py-4">
            <div className="border rounded-lg overflow-hidden h-64 flex items-center justify-center relative">
              {previewUrl ? (
                <div className="w-full h-full relative">
                  <img
                    src={previewUrl}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setSelectedTab("upload");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Nenhuma imagem selecionada para pré-visualização
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                disabled={!selectedFile || updateBackgroundMutation.isPending}
                onClick={handleSubmit}
              >
                {updateBackgroundMutation.isPending ? "Atualizando..." : "Atualizar fundo"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
