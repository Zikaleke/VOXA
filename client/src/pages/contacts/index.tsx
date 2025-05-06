import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useContactModal } from "@/hooks/use-contact-modal";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserInitials } from "@/lib/utils";
import { UserPlus, MessageCircle, Trash, Check, X, Loader2 } from "lucide-react";

type Contact = {
  id: number;
  contact: {
    id: number;
    username: string;
    firstName: string;
    lastName: string | null;
    profilePicUrl: string | null;
    status: string;
  };
  nickname: string | null;
};

type ContactRequest = {
  id: number;
  sender: {
    id: number;
    username: string;
    firstName: string;
    lastName: string | null;
    profilePicUrl: string | null;
    status: string;
  };
  status: string;
  createdAt: string;
};

export default function ContactsPage() {
  const { openModal } = useContactModal();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  // Query to fetch contacts
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      return response.json();
    },
  });

  // Query to fetch contact requests
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/contacts/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts/requests");
      return response.json();
    },
  });

  // Mutation to accept contact request
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/contacts/requests/${requestId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação aceita",
        description: "Solicitação de contato aceita com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a solicitação de contato.",
        variant: "destructive",
      });
    },
  });

  // Mutation to reject contact request
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/contacts/requests/${requestId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação rejeitada",
        description: "Solicitação de contato rejeitada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/requests"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação de contato.",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove contact
  const removeContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest("DELETE", `/api/contacts/${contactId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contato removido",
        description: "Contato removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o contato.",
        variant: "destructive",
      });
    },
  });

  const contacts = contactsData?.contacts || [];
  const contactRequests = requestsData?.requests || [];

  const [, setLocation] = useLocation();
  
  // Function to create conversation with a contact
  const startConversation = async (contactId: number) => {
    try {
      const response = await apiRequest("POST", "/api/conversations", { participantId: contactId });
      const data = await response.json();
      
      // Redirect to the conversation
      setLocation(`/chat/${data.conversation.id}`);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleRejectRequest = (requestId: number) => {
    rejectRequestMutation.mutate(requestId);
  };

  const handleRemoveContact = (contactId: number) => {
    if (window.confirm("Tem certeza que deseja remover este contato?")) {
      removeContactMutation.mutate(contactId);
    }
  };

  const getPendingRequestsCount = () => {
    return contactRequests.length;
  };

  return (
    <div className="container py-6 max-w-5xl">
      <PageHeader
        title="Contatos"
        description="Gerencie seus contatos e solicitações"
        actions={
          <Button onClick={openModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Contato
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mx-auto">
          <TabsTrigger value="all">
            Todos os Contatos
          </TabsTrigger>
          <TabsTrigger value="requests">
            Solicitações
            {getPendingRequestsCount() > 0 && (
              <Badge variant="destructive" className="ml-2">
                {getPendingRequestsCount()}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoadingContacts ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact: Contact) => (
                <Card key={contact.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        {contact.contact.profilePicUrl ? (
                          <AvatarImage src={contact.contact.profilePicUrl} alt={contact.contact.firstName} />
                        ) : (
                          <AvatarFallback className="bg-primary text-white">
                            {getUserInitials(contact.contact.firstName, contact.contact.lastName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="ml-3">
                        <CardTitle className="text-base">
                          {contact.nickname || `${contact.contact.firstName} ${contact.contact.lastName || ''}`}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">@{contact.contact.username}</p>
                      </div>
                    </div>
                    <Badge variant={contact.contact.status === "online" ? "success" : "secondary"} className="text-xs">
                      {contact.contact.status === "online" ? "Online" : "Offline"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between mt-4">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => startConversation(contact.contact.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Mensagem
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum contato ainda</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Você ainda não tem contatos. Adicione amigos para começar a conversar.
              </p>
              <Button onClick={openModal}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {isLoadingRequests ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contactRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {contactRequests.map((request: ContactRequest) => (
                <Card key={request.id} className="overflow-hidden">
                  <div className="flex items-center p-4">
                    <Avatar className="h-10 w-10">
                      {request.sender.profilePicUrl ? (
                        <AvatarImage src={request.sender.profilePicUrl} alt={request.sender.firstName} />
                      ) : (
                        <AvatarFallback className="bg-primary text-white">
                          {getUserInitials(request.sender.firstName, request.sender.lastName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium">
                        {request.sender.firstName} {request.sender.lastName || ''}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{request.sender.username}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={rejectRequestMutation.isPending}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação pendente</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Você não tem solicitações de contato pendentes no momento.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
