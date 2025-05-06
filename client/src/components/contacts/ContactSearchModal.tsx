import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getUserInitials } from "@/lib/utils";
import { Loader2, Search, UserPlus, CheckCircle2, Clock } from "lucide-react";

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type User = {
  id: number;
  username: string;
  firstName: string;
  lastName?: string;
  profilePicUrl?: string;
  status: string;
};

enum RequestStatus {
  NONE = "none",
  PENDING = "pending",
  ACCEPTED = "accepted",
  SENT = "sent",
}

export function ContactSearchModal({ isOpen, onClose }: ContactSearchModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<(User & { requestStatus: RequestStatus })[]>([]);
  // Make sure searchResults is always an array to prevent the 'not iterable' error
  const results = Array.isArray(searchResults) ? searchResults : [];

  // Mutation to send contact request
  const sendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/contacts/request", { recipientId: userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Solicitação de contato enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/requests"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de contato.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      toast({
        title: "Pesquisa inválida",
        description: "Digite pelo menos 3 caracteres para pesquisar.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest("POST", "/api/contacts/search", { query: searchQuery });
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível realizar a pesquisa.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSendRequest = (userId: number) => {
    sendRequestMutation.mutate(userId);
    
    // Update local state to show sent status immediately
    setSearchResults((prev: (User & { requestStatus: RequestStatus })[]) => 
      prev.map((user: User & { requestStatus: RequestStatus }) => 
        user.id === userId ? { ...user, requestStatus: RequestStatus.SENT } : user
      )
    );
  };

  const getRequestStatusText = (status: RequestStatus): string => {
    switch (status) {
      case RequestStatus.SENT:
        return "Solicitação enviada";
      case RequestStatus.PENDING:
        return "Solicitação pendente";
      case RequestStatus.ACCEPTED:
        return "Já é contato";
      default:
        return "";
    }
  };

  const getRequestStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.SENT:
        return <Clock className="h-4 w-4 mr-2" />;
      case RequestStatus.PENDING:
        return <Clock className="h-4 w-4 mr-2" />;
      case RequestStatus.ACCEPTED:
        return <CheckCircle2 className="h-4 w-4 mr-2" />;
      default:
        return <UserPlus className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buscar Usuários</DialogTitle>
          <DialogDescription>
            Encontre usuários pelo nome ou username para adicionar como contatos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-2 my-4">
          <Input
            placeholder="Buscar por nome ou username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[300px]">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((user) => (
                <Card key={user.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        {user.profilePicUrl ? (
                          <AvatarImage src={user.profilePicUrl} alt={user.firstName} />
                        ) : (
                          <AvatarFallback className="bg-primary text-white">
                            {getUserInitials(user.firstName, user.lastName || '')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="ml-3">
                        <p className="font-medium">
                          {user.firstName} {user.lastName || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <div>
                      {user.requestStatus === RequestStatus.NONE ? (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.id)}
                          disabled={sendRequestMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      ) : (
                        <Badge variant="outline" className="flex items-center">
                          {getRequestStatusIcon(user.requestStatus)}
                          {getRequestStatusText(user.requestStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : isSearching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Nenhum usuário encontrado. Tente outra pesquisa.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
