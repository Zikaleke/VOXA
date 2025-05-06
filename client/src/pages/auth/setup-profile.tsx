import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { SetupProfileForm } from "@/components/auth/SetupProfile";

export default function SetupProfilePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/auth/login");
      } else if (user?.profilePicUrl && user?.bio) {
        // If profile is already set up, redirect to chat
        navigate("/chat");
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-primary mb-2">Voxa</h1>
      <p className="text-gray-600 mb-8">Configure seu perfil</p>
      
      <SetupProfileForm />
      
      <p className="mt-8 text-xs text-gray-500 max-w-md text-center">
        Adicione uma foto de perfil e mais informações para que seus contatos possam te identificar facilmente.
      </p>
    </div>
  );
}
