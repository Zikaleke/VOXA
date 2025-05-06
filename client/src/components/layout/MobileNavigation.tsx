import { Link, useLocation } from "wouter";
import { MessageSquare, Users, Radio, Phone, Settings } from "lucide-react";

export function MobileNavigation() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-1 z-10">
      <div className="flex justify-around">
        <Link href="/chat" className={`p-2 flex flex-col items-center ${location.startsWith('/chat') ? 'text-primary' : 'text-gray-500'}`}>
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">Conversas</span>
        </Link>
        
        <Link href="/groups" className={`p-2 flex flex-col items-center ${location.startsWith('/groups') ? 'text-primary' : 'text-gray-500'}`}>
          <Users className="h-5 w-5" />
          <span className="text-xs">Grupos</span>
        </Link>
        
        <Link href="/channels" className={`p-2 flex flex-col items-center ${location.startsWith('/channels') ? 'text-primary' : 'text-gray-500'}`}>
          <Radio className="h-5 w-5" />
          <span className="text-xs">Canais</span>
        </Link>
        
        <Link href="/calls" className={`p-2 flex flex-col items-center ${location.startsWith('/calls') ? 'text-primary' : 'text-gray-500'}`}>
          <Phone className="h-5 w-5" />
          <span className="text-xs">Chamadas</span>
        </Link>
        
        <Link href="/settings" className={`p-2 flex flex-col items-center ${location.startsWith('/settings') ? 'text-primary' : 'text-gray-500'}`}>
          <Settings className="h-5 w-5" />
          <span className="text-xs">Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}
