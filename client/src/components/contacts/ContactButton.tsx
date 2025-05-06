import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContactModal } from "@/hooks/use-contact-modal";

export function ContactButton() {
  const { openModal } = useContactModal();

  return (
    <Button variant="outline" onClick={openModal}>
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Contato
    </Button>
  );
}
