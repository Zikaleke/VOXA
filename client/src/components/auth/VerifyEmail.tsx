import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { VerifyEmailData } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const verifySchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().min(1, "Código de verificação é obrigatório"),
});

export function VerifyEmailForm() {
  const { verify, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // Auto-fill form data from localStorage if available
  useEffect(() => {
    const pendingVerification = localStorage.getItem("pendingVerification");
    if (pendingVerification) {
      try {
        const { email, code } = JSON.parse(pendingVerification);
        form.setValue("email", email);
        setDemoCode(code);
      } catch (err) {
        console.error("Error parsing pending verification data", err);
      }
    }
  }, []);

  const form = useForm<VerifyEmailData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const onSubmit = async (data: VerifyEmailData) => {
    try {
      setError(null);
      await verify(data);
      localStorage.removeItem("pendingVerification");
      navigate("/auth/login");
    } catch (err: any) {
      setError(err.message || "Erro ao verificar email. Verifique o código e tente novamente.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Verificar Email</CardTitle>
        <CardDescription className="text-center">
          Digite o código de verificação enviado para seu email
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
            
            {demoCode && (
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Para fins de demonstração, use este código: <strong>{demoCode}</strong>
                </AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="seu@email.com" 
                      {...field} 
                      disabled={!!field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o código" 
                      {...field} 
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
              {isLoading ? "Verificando..." : "Verificar Email"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-gray-500 text-center">
          Não recebeu o código?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Registrar novamente
          </Link>
        </p>
        <p className="text-sm text-gray-500 text-center">
          <Link href="/auth/login" className="text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
