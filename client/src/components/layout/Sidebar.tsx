import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationsList } from "@/components/conversations/ConversationsList";
import { getUserInitials } from "@/lib/utils";
import { Search, MessageSquare, Users, Radio, Phone, Settings, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavTab = "conversations" | "groups" | "channels";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
  };

  return (
    <aside className="hidden md:flex flex-col w-72 h-full border-r border-gray-200 bg-white">
      {/* User Profile Section */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Avatar>
            {user?.profilePicUrl ? (
              <AvatarImage src={user.profilePicUrl} alt="Foto de perfil" />
            ) : (
              <AvatarFallback className="bg-primary text-white">
                {getUserInitials(user?.firstName || "", user?.lastName)}
              </AvatarFallback>
            )}
          </Avatar>
          {user?.status === "online" && (
            <span className="online-indicator"></span>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="font-semibold text-gray-800">
            {user?.firstName} {user?.lastName}
          </h3>
          <p className="text-xs text-gray-500">
            {user?.status === "online" ? "Online" : "Offline"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/profile">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Pesquisar"
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "conversations"
              ? "text-primary border-b-2 border-primary font-medium"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("conversations")}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Conversas
        </button>
        <button
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "groups"
              ? "text-primary border-b-2 border-primary font-medium"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("groups")}
        >
          <Users className="h-4 w-4 mr-1" />
          Grupos
        </button>
        <button
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "channels"
              ? "text-primary border-b-2 border-primary font-medium"
              : "text-gray-500"
          }`}
          onClick={() => handleTabChange("channels")}
        >
          <Radio className="h-4 w-4 mr-1" />
          Canais
        </button>
      </div>
      
      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "conversations" && (
          <ConversationsList searchQuery={searchQuery} />
        )}
        {activeTab === "groups" && (
          <div className="p-4 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>Seus grupos aparecerão aqui</p>
          </div>
        )}
        {activeTab === "channels" && (
          <div className="p-4 text-center text-gray-500">
            <Radio className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>Seus canais aparecerão aqui</p>
          </div>
        )}
      </div>
      
      {/* Bottom Action Button */}
      <div className="p-4 border-t border-gray-200">
        <Button className="w-full flex items-center justify-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Nova Conversa
        </Button>
      </div>
    </aside>
  );
}
