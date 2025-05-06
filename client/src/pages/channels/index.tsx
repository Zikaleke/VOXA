import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Plus, Radio } from "lucide-react";

export default function ChannelsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Canais</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Canal
          </Button>
        </header>
        
        <div className="flex-1 p-4 flex flex-col items-center justify-center">
          <Radio className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum canal ainda</h2>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Crie um canal para compartilhar informações com muitas pessoas
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Criar Canal
          </Button>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
}
