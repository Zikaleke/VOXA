import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { setupSocket, closeSocket, addConnectionStatusListener } from '@/lib/socket';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface SocketContextProps {
  status: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const { toast } = useToast();

  // Setup WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      if (token) {
        setupSocket(token);
        setStatus('connecting');
      }
    } else {
      closeSocket();
      setStatus('disconnected');
    }
  }, [isAuthenticated, user]);

  // Listen for connection status changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const removeListener = addConnectionStatusListener((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus === 'connected') {
        toast({
          title: 'Conectado',
          description: 'Você está conectado ao servidor em tempo real.',
          duration: 3000,
        });
      } else if (newStatus === 'disconnected') {
        toast({
          variant: 'destructive',
          title: 'Desconectado',
          description: 'Você foi desconectado. Tentando reconectar...',
          duration: 5000,
        });
      }
    });

    return () => {
      removeListener();
    };
  }, [isAuthenticated, toast]);

  const reconnect = () => {
    const token = localStorage.getItem('token');
    if (token) {
      closeSocket();
      setupSocket(token);
      setStatus('connecting');
    }
  };

  return (
    <SocketContext.Provider
      value={{
        status,
        isConnected: status === 'connected',
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
