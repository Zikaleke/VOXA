import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-primary mb-2">TeleClone</h1>
      <p className="text-gray-600 mb-8">Plataforma de mensagens seguras</p>
      
      <LoginForm />
      
      <p className="mt-8 text-xs text-gray-500 max-w-md text-center">
        Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade.
        Seus dados estão seguros conosco.
      </p>
    </div>
  );
}
