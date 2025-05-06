import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";

const profileSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().optional(),
  bio: z.string().max(160, "Bio deve ter no máximo 160 caracteres").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function SetupProfileForm() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
    },
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update profile data
      await apiRequest("PUT", "/api/users/profile", data);

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

      // Navigate to chat after setup
      navigate("/chat");
    } catch (err: any) {
      setError(err.message || "Erro ao configurar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Complete seu Perfil</CardTitle>
        <CardDescription className="text-center">
          Adicione mais detalhes ao seu perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center mb-6">
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
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conte um pouco sobre você" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Concluir"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
