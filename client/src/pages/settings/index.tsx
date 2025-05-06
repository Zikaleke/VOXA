import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Bell, LockKeyhole, Monitor, Database, Globe, HelpCircle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
        <header className="bg-white border-b border-gray-200 p-4 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate("/chat")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Configurações</h1>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Moon className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Aparência</CardTitle>
                </div>
                <CardDescription>
                  Personalize a aparência do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tema escuro</p>
                    <p className="text-sm text-gray-500">
                      Ativar modo escuro
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Notificações</CardTitle>
                </div>
                <CardDescription>
                  Gerencie como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sons</p>
                    <p className="text-sm text-gray-500">
                      Reproduzir sons para notificações
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Visualização de mensagens</p>
                    <p className="text-sm text-gray-500">
                      Exibir conteúdo nas notificações
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <LockKeyhole className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Privacidade</CardTitle>
                </div>
                <CardDescription>
                  Gerencie quem pode ver suas informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Último acesso</p>
                    <p className="text-sm text-gray-500">
                      Mostrar quando estive online pela última vez
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Confirmações de leitura</p>
                    <p className="text-sm text-gray-500">
                      Enviar confirmações de leitura
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Armazenamento</CardTitle>
                </div>
                <CardDescription>
                  Gerencie o uso de dados do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Limpar cache
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Ajuda e Suporte</CardTitle>
                </div>
                <CardDescription>
                  Encontre ajuda e informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  Sobre o TeleClone
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Perguntas frequentes
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Política de privacidade
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Termos de uso
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
}
