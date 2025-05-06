import { generateTempId } from "./utils";
import { Message, PendingMessage, User } from "@/types";

let socket: WebSocket | null = null;
let messageListeners: ((message: any) => void)[] = [];
let connectionStatusListeners: ((status: "connected" | "disconnected" | "connecting") => void)[] = [];
let isConnecting = false;

export function setupSocket(token: string) {
  if (socket || isConnecting) return;
  
  isConnecting = true;
  
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
      
      // Authenticate the connection
      if (socket) {
        socket.send(JSON.stringify({
          type: "auth",
          payload: { token }
        }));
        
        notifyConnectionStatusListeners("connected");
        isConnecting = false;
      }
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        notifyMessageListeners(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null;
      notifyConnectionStatusListeners("disconnected");
      isConnecting = false;
      
      // Try to reconnect after a delay
      setTimeout(() => {
        setupSocket(token);
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      isConnecting = false;
    };
  } catch (error) {
    console.error("Error setting up WebSocket:", error);
    isConnecting = false;
  }
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function addMessageListener(listener: (message: any) => void) {
  messageListeners.push(listener);
  return () => {
    messageListeners = messageListeners.filter(l => l !== listener);
  };
}

export function addConnectionStatusListener(listener: (status: "connected" | "disconnected" | "connecting") => void) {
  connectionStatusListeners.push(listener);
  return () => {
    connectionStatusListeners = connectionStatusListeners.filter(l => l !== listener);
  };
}

function notifyMessageListeners(message: any) {
  messageListeners.forEach(listener => listener(message));
}

function notifyConnectionStatusListeners(status: "connected" | "disconnected" | "connecting") {
  connectionStatusListeners.forEach(listener => listener(status));
}

export function sendMessage(content: string, conversationId?: number, groupId?: number, channelId?: number, replyToId?: number) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket not connected");
    return null;
  }
  
  const tempId = generateTempId();
  const now = new Date().toISOString();
  
  socket.send(JSON.stringify({
    type: "message",
    payload: {
      tempId,
      content,
      conversationId,
      groupId,
      channelId,
      replyToId,
      type: "text"
    }
  }));
  
  return {
    tempId,
    senderId: parseInt(localStorage.getItem("userId") || "0"),
    content,
    conversationId,
    groupId,
    channelId,
    replyToId,
    type: "text" as const,
    status: "sending" as const,
    sentAt: now,
    createdAt: now
  };
}

export function sendTypingIndicator(conversationId?: number, groupId?: number, isTyping: boolean = true) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  
  socket.send(JSON.stringify({
    type: "typing",
    payload: {
      conversationId,
      groupId,
      isTyping
    }
  }));
}

export function updateMessageStatus(messageId: number, status: 'delivered' | 'read') {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  
  socket.send(JSON.stringify({
    type: "message_status",
    payload: {
      messageId,
      status
    }
  }));
}

export function initiateCall(type: 'audio' | 'video', conversationId?: number, groupId?: number, recipientId?: number) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  
  socket.send(JSON.stringify({
    type: "call",
    payload: {
      action: "initiate",
      callType: type,
      conversationId,
      groupId,
      recipientId
    }
  }));
}
