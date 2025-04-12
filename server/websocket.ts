import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { parse } from 'url';
import { storage } from './storage';

// Define the message types for WebSocket communication
type MessageType = 
  | 'JOIN_PROJECT'
  | 'LEAVE_PROJECT'
  | 'EDIT_TRANSLATION'
  | 'APPROVE_TRANSLATION'
  | 'SYNC_STATUS'
  | 'ERROR';

// Define the structure of WebSocket messages
interface WebSocketMessage {
  type: MessageType;
  projectId?: number;
  userId?: number;
  keyId?: number;
  languageId?: number;
  value?: string;
  isApproved?: boolean;
  error?: string;
  userName?: string;
  timestamp?: number;
}

// Define client connection data
interface ClientConnection {
  ws: WebSocket;
  userId: number | null;
  projectId: number | null;
  userName: string | null;
  isAuthenticated: boolean;
}

// Store active connections
const clients = new Map<WebSocket, ClientConnection>();

// Store users currently editing a specific translation
const activeEditors = new Map<string, Set<number>>();

// Helper function to get a key for translation
function getTranslationKey(keyId: number, languageId: number): string {
  return `${keyId}-${languageId}`;
}

// Helper function to broadcast a message to all clients in a project
function broadcastToProject(projectId: number, message: WebSocketMessage, excludeWs?: WebSocket): void {
  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN && client.projectId === projectId && ws !== excludeWs) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Helper function to validate if the user can access a project
async function canAccessProject(userId: number, projectId: number): Promise<boolean> {
  try {
    const projects = await storage.getProjectsByUser(userId);
    return projects.some(p => p.id === projectId);
  } catch (error) {
    console.error('Error checking project access:', error);
    return false;
  }
}

// Set up the WebSocket server
export function setupWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  console.log('WebSocket server initialized on path: /ws');

  wss.on('connection', async (ws, req) => {
    // Initialize client data
    clients.set(ws, {
      ws,
      userId: null,
      projectId: null,
      userName: null,
      isAuthenticated: false
    });

    console.log('New WebSocket connection established');

    // Handle authentication via query parameters or session
    const { query } = parse(req.url || '', true);
    const userId = query.userId ? parseInt(query.userId as string) : null;
    const authToken = query.token as string;

    // This is a simplified authentication check. In a real app, you'd validate the token
    // against your authentication system or use session data.
    if (userId && authToken) {
      try {
        const user = await storage.getUser(userId);
        
        if (user) {
          // Update client data with authentication info
          const client = clients.get(ws);
          if (client) {
            client.userId = userId;
            client.userName = user.username;
            client.isAuthenticated = true;
            
            // Send confirmation of authentication
            ws.send(JSON.stringify({
              type: 'SYNC_STATUS',
              userId,
              userName: user.username,
              timestamp: Date.now()
            }));
            
            console.log(`User ${user.username} authenticated via WebSocket`);
          }
        }
      } catch (error) {
        console.error('Error authenticating WebSocket user:', error);
      }
    }

    // Handle incoming messages
    ws.on('message', async (messageData) => {
      try {
        const client = clients.get(ws);
        if (!client) return;

        // Parse the message
        const message: WebSocketMessage = JSON.parse(messageData.toString());
        
        // All message handlers require authentication except the error reporting
        if (!client.isAuthenticated && message.type !== 'ERROR') {
          ws.send(JSON.stringify({
            type: 'ERROR',
            error: 'Not authenticated',
            timestamp: Date.now()
          }));
          return;
        }

        // Handle different message types
        switch (message.type) {
          case 'JOIN_PROJECT': {
            if (!message.projectId || !client.userId) break;
            
            // Check if user has access to this project
            const canAccess = await canAccessProject(client.userId, message.projectId);
            if (!canAccess) {
              ws.send(JSON.stringify({
                type: 'ERROR',
                error: 'Access denied to project',
                timestamp: Date.now()
              }));
              break;
            }
            
            // Update client with project info
            client.projectId = message.projectId;
            
            // Notify others in the project that this user joined
            broadcastToProject(message.projectId, {
              type: 'JOIN_PROJECT',
              projectId: message.projectId,
              userId: client.userId,
              userName: client.userName,
              timestamp: Date.now()
            }, ws);
            
            console.log(`User ${client.userName} joined project ${message.projectId}`);
            break;
          }
          
          case 'LEAVE_PROJECT': {
            if (!client.projectId || !client.userId) break;
            
            const projectId = client.projectId;
            
            // Notify others in the project that this user left
            broadcastToProject(projectId, {
              type: 'LEAVE_PROJECT',
              projectId,
              userId: client.userId,
              userName: client.userName,
              timestamp: Date.now()
            }, ws);
            
            // Remove the project from the client
            client.projectId = null;
            
            console.log(`User ${client.userName} left project ${projectId}`);
            break;
          }
          
          case 'EDIT_TRANSLATION': {
            if (!message.keyId || !message.languageId || !client.projectId || !client.userId) break;
            
            const translationKey = getTranslationKey(message.keyId, message.languageId);
            
            // Get the current key to ensure user has access
            const key = await storage.getTranslationKey(message.keyId);
            if (!key || key.projectId !== client.projectId) {
              ws.send(JSON.stringify({
                type: 'ERROR',
                error: 'Access denied to translation key',
                timestamp: Date.now()
              }));
              break;
            }
            
            // Track that this user is editing the translation
            if (!activeEditors.has(translationKey)) {
              activeEditors.set(translationKey, new Set());
            }
            activeEditors.get(translationKey)?.add(client.userId);
            
            // Broadcast the edit to other users in the project
            broadcastToProject(client.projectId, {
              type: 'EDIT_TRANSLATION',
              projectId: client.projectId,
              keyId: message.keyId,
              languageId: message.languageId,
              userId: client.userId,
              userName: client.userName,
              value: message.value,
              timestamp: Date.now()
            }, ws);
            
            console.log(`User ${client.userName} editing translation for key ${message.keyId} in language ${message.languageId}`);
            break;
          }
          
          case 'APPROVE_TRANSLATION': {
            if (!message.keyId || !message.languageId || !client.projectId || !client.userId) break;
            
            // Get the current key to ensure user has access
            const key = await storage.getTranslationKey(message.keyId);
            if (!key || key.projectId !== client.projectId) {
              ws.send(JSON.stringify({
                type: 'ERROR',
                error: 'Access denied to translation key',
                timestamp: Date.now()
              }));
              break;
            }
            
            // Update the translation in the database
            const translation = await storage.getTranslationByLanguage(message.keyId, message.languageId);
            if (translation) {
              await storage.updateTranslation(translation.id, {
                isApproved: message.isApproved || false,
                updatedAt: new Date()
              });
              
              // Log activity
              await storage.logActivity({
                projectId: client.projectId,
                userId: client.userId,
                action: message.isApproved ? 'approved' : 'rejected',
                resourceType: 'translation',
                resourceId: translation.id,
                details: { key: key.key }
              });
              
              // Broadcast the approval status to all users in the project
              broadcastToProject(client.projectId, {
                type: 'APPROVE_TRANSLATION',
                projectId: client.projectId,
                keyId: message.keyId,
                languageId: message.languageId,
                userId: client.userId,
                userName: client.userName,
                isApproved: message.isApproved,
                timestamp: Date.now()
              });
              
              console.log(`User ${client.userName} ${message.isApproved ? 'approved' : 'rejected'} translation for key ${message.keyId} in language ${message.languageId}`);
            }
            break;
          }
          
          case 'ERROR': {
            console.error('Client reported error:', message.error);
            break;
          }
          
          default:
            console.warn('Unknown message type:', message.type);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      const client = clients.get(ws);
      if (client && client.projectId && client.userId) {
        // Notify others in the project that this user left
        broadcastToProject(client.projectId, {
          type: 'LEAVE_PROJECT',
          projectId: client.projectId,
          userId: client.userId,
          userName: client.userName,
          timestamp: Date.now()
        });
        
        // Remove this user from any translations they were editing
        activeEditors.forEach((editors, translationKey) => {
          if (client.userId) {
            editors.delete(client.userId);
            if (editors.size === 0) {
              activeEditors.delete(translationKey);
            }
          }
        });
        
        console.log(`User ${client.userName} disconnected from WebSocket`);
      }
      
      // Remove the client from our records
      clients.delete(ws);
    });
  });
}