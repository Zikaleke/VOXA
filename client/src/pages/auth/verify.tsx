import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { VerifyEmailForm } from "@/components/auth/VerifyEmail";

export default function VerifyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if there's any pending verification in localStorage
    const pendingVerification = localStorage.getItem("pendingVerification");
    
    if (!pendingVerification && !isLoading) {
      navigate("/auth/register");
      return;
    }
    
    if (!isLoading && isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-primary mb-2">TeleClone</h1>
      <p className="text-gray-600 mb-8">Verifique seu email</p>
      
      <VerifyEmailForm />
      
      <p className="mt-8 text-xs text-gray-500 max-w-md text-center">
        Enviamos um código de verificação para seu email.
        Por favor, verifique sua caixa de entrada ou spam.
      </p>
    </div>
  );
}
