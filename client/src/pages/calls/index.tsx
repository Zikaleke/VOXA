import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Phone, Video } from "lucide-react";

export default function CallsPage() {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Chamadas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar uma nova chamada</CardTitle>
            <CardDescription>
              Inicie uma chamada de áudio ou vídeo com seus contatos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex space-x-4">
            <Button
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => navigate("/chat")}
            >
              <Phone size={18} />
              Chamada de áudio
            </Button>
            <Button
              variant="outline" 
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => navigate("/chat")}
            >
              <Video size={18} />
              Chamada de vídeo
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de chamadas</CardTitle>
            <CardDescription>
              Visualize suas chamadas recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Sem chamadas recentes
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
