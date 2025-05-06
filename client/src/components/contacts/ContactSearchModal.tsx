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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import { Search, UserPlus, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [requestStatus, setRequestStatus] = useState<Record<number, RequestStatus>>({});
  const { toast } = useToast();

  // Query to fetch current contacts
  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      return response.json();
    },
    enabled: isOpen,
  });

  // Query to fetch current pending requests
  const { data: pendingRequests } = useQuery({
    queryKey: ["/api/contacts/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts/requests");
      return response.json();
    },
    enabled: isOpen,
  });

  // Mutation to send contact request
  const sendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/contacts/request", { recipientId: userId });
      return response.json();
    },
    onSuccess: (_, userId) => {
      toast({
        title: "Solicitação enviada",
        description: "Solicitação de contato enviada com sucesso.",
      });
      setRequestStatus(prev => ({ ...prev, [userId]: RequestStatus.SENT }));
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de contato.",
        variant: "destructive",
      });
    }
  });

  const handleSearch = async () => {
    if (searchQuery.trim().length < 1) return;
    
    setIsSearching(true);
    try {
      const response = await apiRequest("POST", "/api/contacts/search", { query: searchQuery });
      const data = await response.json();
      setSearchResults(data.users || []);
      
      // Update request status for each user
      const statusMap: Record<number, RequestStatus> = {};
      
      // Mark users who are already contacts
      if (contacts?.contacts) {
        contacts.contacts.forEach((contact: any) => {
          statusMap[contact.user.id] = RequestStatus.ACCEPTED;
        });
      }
      
      // Mark users who have sent pending requests
      if (pendingRequests?.requests) {
        pendingRequests.requests.forEach((request: any) => {
          statusMap[request.sender.id] = RequestStatus.PENDING;
        });
      }
      
      setRequestStatus(statusMap);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Erro na pesquisa",
        description: "Não foi possível buscar usuários.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = (userId: number) => {
    sendRequestMutation.mutate(userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buscar Usuários</DialogTitle>
          <DialogDescription>
            Pesquise por nome de usuário, nome ou email para adicionar novos contatos.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                className="pl-9"
                placeholder="Pesquisar usuários"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              Buscar
            </Button>
          </div>
        </div>

        <div className="space-y-4 my-4">
          {isSearching ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">Buscando usuários...</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <Avatar className="h-10 w-10">
                  {user.profilePicUrl ? (
                    <AvatarImage src={user.profilePicUrl} alt={user.firstName} />
                  ) : (
                    <AvatarFallback className="bg-primary text-white">
                      {getUserInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-3 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                </div>
                {requestStatus[user.id] === RequestStatus.ACCEPTED ? (
                  <span className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Contato
                  </span>
                ) : requestStatus[user.id] === RequestStatus.PENDING ? (
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-500 flex items-center">
                    <UserPlus className="h-4 w-4 mr-1" /> Pendente
                  </span>
                ) : requestStatus[user.id] === RequestStatus.SENT ? (
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-500 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Enviado
                  </span>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sendRequestMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                )}
              </div>
            ))
          ) : searchQuery.trim() !== "" && (
            <div className="text-center py-6">
              <X className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum usuário encontrado.</p>
            </div>
          )}
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
