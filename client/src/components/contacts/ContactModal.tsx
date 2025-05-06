import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useContactModal } from "@/hooks/use-contact-modal";

export function ContactModal() {
  const { isOpen, closeModal } = useContactModal();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim()) {
      toast({
        title: "Erro",
        description: "Digite um username ou e-mail válido",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/contacts", { 
        identifier: contactInfo.trim() 
      });
      const data = await response.json();

      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso",
      });

      // Invalidate the contacts cache
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      // Invalidate the conversations cache since a new conversation might be available
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Reset form and close modal
      setContactInfo("");
      closeModal();
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o contato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Contato</DialogTitle>
            <DialogDescription>
              Adicione um novo contato pelo username ou e-mail
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactInfo" className="text-right">
                Contato
              </Label>
              <Input
                id="contactInfo"
                value={contactInfo}
                onChange={handleChange}
                placeholder="Username ou e-mail"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
