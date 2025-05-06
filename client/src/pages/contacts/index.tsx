import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactButton } from "@/components/contacts/ContactButton";
import { getUserInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, UserPlus, UserCheck, Users, MessageSquare, X } from "lucide-react";

type Contact = {
  id: number;
  userId: number;
  contactId: number;
  nickname?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName?: string;
    email: string;
    profilePicUrl?: string;
    status: string;
  };
};

type PendingRequest = {
  id: number;
  senderId: number;
  recipientId: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  sender: {
    id: number;
    username: string;
    firstName: string;
    lastName?: string;
    profilePicUrl?: string;
  };
};

export default function ContactsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch pending contact requests
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/contacts/requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contacts/requests");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleStartConversation = async (contactId: number) => {
    try {
      const response = await apiRequest("POST", "/api/conversations", { participantId: contactId });
      const data = await response.json();
      navigate(`/chat/${data.conversation.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiRequest("POST", `/api/contacts/requests/${requestId}/accept`);
      toast({
        title: "Sucesso",
        description: "Solicitação de contato aceita!",
      });
      // Refresh the data
      window.location.reload();
    } catch (error) {
      console.error("Error accepting contact request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a solicitação.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiRequest("POST", `/api/contacts/requests/${requestId}/reject`);
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de contato foi rejeitada.",
      });
      // Refresh the data
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting contact request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold dark:text-white">Contatos</h1>
          <ContactButton />
        </header>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Pesquisar contatos"
                  className="pl-10 pr-4 py-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Tabs defaultValue="contacts" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="contacts">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Contatos
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Solicitações
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="contacts" className="space-y-4">
                {contactsLoading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Carregando contatos...</p>
                  </div>
                ) : contacts?.contacts?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contacts.contacts
                      .filter((contact: Contact) => {
                        const fullName = `${contact.user.firstName} ${contact.user.lastName || ''}`.trim().toLowerCase();
                        const username = contact.user.username.toLowerCase();
                        const query = searchQuery.toLowerCase();
                        return fullName.includes(query) || username.includes(query);
                      })
                      .map((contact: Contact) => (
                        <div 
                          key={contact.id} 
                          className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                          <Avatar className="h-12 w-12">
                            {contact.user.profilePicUrl ? (
                              <AvatarImage src={contact.user.profilePicUrl} alt={contact.user.firstName} />
                            ) : (
                              <AvatarFallback className="bg-primary text-white">
                                {getUserInitials(contact.user.firstName, contact.user.lastName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="ml-4 flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {contact.user.firstName} {contact.user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{contact.user.username}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleStartConversation(contact.user.id)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Conversar
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhum contato ainda</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Adicione contatos para começar a conversar
                    </p>
                    <ContactButton />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="requests" className="space-y-4">
                {requestsLoading ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Carregando solicitações...</p>
                  </div>
                ) : pendingRequests?.requests?.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.requests.map((request: PendingRequest) => (
                      <div 
                        key={request.id} 
                        className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <Avatar className="h-12 w-12">
                          {request.sender.profilePicUrl ? (
                            <AvatarImage src={request.sender.profilePicUrl} alt={request.sender.firstName} />
                          ) : (
                            <AvatarFallback className="bg-primary text-white">
                              {getUserInitials(request.sender.firstName, request.sender.lastName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="ml-4 flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.sender.firstName} {request.sender.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{request.sender.username}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleAcceptRequest(request.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Aceitar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRejectRequest(request.id)}>
                            <X className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserPlus className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhuma solicitação pendente</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Quando alguém te adicionar como contato, aparecerá aqui
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
}
