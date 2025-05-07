import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { verifyToken } from './auth';

// Define the structure for authenticated WebSocket connections
interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
}

// Connected clients
const clients = new Map<number, AuthenticatedSocket>();

// Message types
const MESSAGE_TYPES = {
  AUTH: 'auth',
  MESSAGE: 'message',
  MESSAGE_STATUS: 'message_status',
  TYPING: 'typing',
  CALL: 'call',
  PRESENCE: 'presence',
  ERROR: 'error'
};

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  
  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAlive = true;
    
    // Handle pings to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === MESSAGE_TYPES.AUTH) {
          const { token } = data.payload;
          const decoded = verifyToken(token);
          
          if (!decoded) {
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.ERROR,
              payload: { message: 'Invalid authentication token' }
            }));
            return;
          }
          
          // Set userId on socket
          ws.userId = decoded.userId;
          
          // Add to clients map
          clients.set(decoded.userId, ws);
          
          // Update user status
          await storage.setUserStatus(decoded.userId, 'online');
          
          // Notify user's contacts
          const contacts = await storage.getContacts(decoded.userId);
          contacts.forEach(contact => {
            const client = clients.get(contact.contact.id);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: MESSAGE_TYPES.PRESENCE,
                payload: {
                  userId: decoded.userId,
                  status: 'online'
                }
              }));
            }
          });
          
          return;
        }
        
        // Ensure authenticated
        if (!ws.userId) {
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: 'Not authenticated' }
          }));
          return;
        }
        
        // Handle message sending
        if (data.type === MESSAGE_TYPES.MESSAGE) {
          const { conversationId, groupId, channelId, content, type = 'text', replyToId } = data.payload;
          
          // Create message
          const message = await storage.createMessage({
            senderId: ws.userId,
            content,
            type,
            conversationId,
            groupId,
            channelId,
            replyToId
          });
          
          // Format message data for response
          const messageData = {
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            conversationId: message.conversationId,
            groupId: message.groupId,
            channelId: message.channelId,
            replyToId: message.replyToId,
            status: message.status,
            sentAt: message.sentAt,
            createdAt: message.createdAt
          };
          
          // Notify sender with message confirmation
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.MESSAGE,
            payload: {
              message: messageData,
              tempId: data.payload.tempId // Return tempId for client-side mapping
            }
          }));
          
          // Determine recipients and send to them
          if (conversationId) {
            // Get conversation participants
            const conversation = await storage.getConversation(conversationId);
            if (conversation) {
              conversation.participants.forEach(participant => {
                if (participant.user.id !== ws.userId) {
                  const client = clients.get(participant.user.id);
                  if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: MESSAGE_TYPES.MESSAGE,
                      payload: { message: messageData }
                    }));
                  }
                }
              });
            }
          }
        }
        
        // Handle typing indicators
        if (data.type === MESSAGE_TYPES.TYPING) {
          const { conversationId, groupId, isTyping } = data.payload;
          
          if (conversationId) {
            // Get conversation participants
            const conversation = await storage.getConversation(conversationId);
            if (conversation) {
              conversation.participants.forEach(participant => {
                if (participant.user.id !== ws.userId) {
                  const client = clients.get(participant.user.id);
                  if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: MESSAGE_TYPES.TYPING,
                      payload: {
                        conversationId,
                        userId: ws.userId,
                        isTyping
                      }
                    }));
                  }
                }
              });
            }
          }
        }
        
        // Handle message status updates
        if (data.type === MESSAGE_TYPES.MESSAGE_STATUS) {
          const { messageId, status } = data.payload;
          
          // Update message status
          const message = await storage.updateMessageStatus(messageId, status);
          
          if (message) {
            // Notify sender of the message
            const senderClient = clients.get(message.senderId);
            if (senderClient && senderClient.readyState === WebSocket.OPEN && senderClient.userId !== ws.userId) {
              senderClient.send(JSON.stringify({
                type: MESSAGE_TYPES.MESSAGE_STATUS,
                payload: {
                  messageId: message.id,
                  status,
                  updatedAt: message.updatedAt
                }
              }));
            }
          }
        }
        
        // Handle call signaling
        if (data.type === MESSAGE_TYPES.CALL) {
          const { action, conversationId, groupId, callType, callId, recipientId } = data.payload;
          
          if (action === 'initiate') {
            // Create new call
            const call = await storage.createCall({
              initiatorId: ws.userId,
              conversationId,
              groupId,
              type: callType
            });
            
            // Notify recipients
            if (conversationId) {
              const conversation = await storage.getConversation(conversationId);
              if (conversation) {
                conversation.participants.forEach(participant => {
                  if (participant.user.id !== ws.userId) {
                    const client = clients.get(participant.user.id);
                    if (client && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: MESSAGE_TYPES.CALL,
                        payload: {
                          action: 'incoming',
                          callId: call.id,
                          initiatorId: ws.userId,
                          conversationId,
                          callType
                        }
                      }));
                    }
                  }
                });
              }
            } else if (recipientId) {
              const client = clients.get(recipientId);
              if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: MESSAGE_TYPES.CALL,
                  payload: {
                    action: 'incoming',
                    callId: call.id,
                    initiatorId: ws.userId,
                    callType
                  }
                }));
              }
            }
            
            // Respond to initiator
            ws.send(JSON.stringify({
              type: MESSAGE_TYPES.CALL,
              payload: {
                action: 'initiated',
                callId: call.id
              }
            }));
          }
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: MESSAGE_TYPES.ERROR,
          payload: { message: 'Error processing message' }
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', async () => {
      if (ws.userId) {
        // Set user offline
        await storage.setUserStatus(ws.userId, 'offline');
        
        // Remove from clients map
        clients.delete(ws.userId);
        
        // Notify contacts
        const contacts = await storage.getContacts(ws.userId);
        contacts.forEach(contact => {
          const client = clients.get(contact.contact.id);
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: MESSAGE_TYPES.PRESENCE,
              payload: {
                userId: ws.userId,
                status: 'offline'
              }
            }));
          }
        });
      }
    });
  });
  
  // Set up interval to ping clients and clean up dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedSocket) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  return wss;
}
