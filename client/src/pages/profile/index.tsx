import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import { Upload, ArrowLeft, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
    
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setBio(user.bio || "");
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Update profile data
      await apiRequest("PUT", "/api/users/profile", {
        firstName,
        lastName,
        bio
      });

      // Upload profile picture if selected
      if (profilePicture) {
        const formData = new FormData();
        formData.append("file", profilePicture);
        
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!res.ok) {
          throw new Error("Falha ao enviar foto de perfil");
        }
        
        const { media } = await res.json();
        await apiRequest("PUT", "/api/users/profile", { 
          profilePicUrl: media.fileUrl 
        });
      }

      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso",
      });
      
      // Reload the page to refresh user data
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
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
          <h1 className="text-xl font-semibold">Perfil</h1>
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Suas Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {profilePicturePreview ? (
                      <AvatarImage src={profilePicturePreview} alt="Foto de perfil" />
                    ) : user?.profilePicUrl ? (
                      <AvatarImage src={user.profilePicUrl} alt="Foto de perfil" />
                    ) : (
                      <AvatarFallback className="text-xl bg-primary text-white">
                        {getUserInitials(user?.firstName || "", user?.lastName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label 
                    htmlFor="profile-picture" 
                    className="absolute -bottom-1 -right-1 p-2 bg-primary rounded-full text-white cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                  </label>
                  <input 
                    id="profile-picture" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleProfilePictureChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    Nome
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Sobrenome
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Nome de usuário
                </label>
                <div className="flex">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    value={user?.username}
                    className="rounded-l-none"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500">
                  O nome de usuário não pode ser alterado
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você"
                  className="resize-none h-24"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Máximo de 160 caracteres
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
}
