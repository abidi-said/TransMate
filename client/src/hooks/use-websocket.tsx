import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Define the message types for WebSocket communication (same as server)
type MessageType = 
  | 'JOIN_PROJECT'
  | 'LEAVE_PROJECT'
  | 'EDIT_TRANSLATION'
  | 'APPROVE_TRANSLATION'
  | 'SYNC_STATUS'
  | 'ERROR';

// Define the structure of WebSocket messages (same as server)
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

// Define the types for the hook result
interface UseWebSocketResult {
  connected: boolean;
  connecting: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  messages: WebSocketMessage[];
  joinProject: (projectId: number) => void;
  leaveProject: () => void;
  editTranslation: (keyId: number, languageId: number, value: string) => void;
  approveTranslation: (keyId: number, languageId: number, isApproved: boolean) => void;
  activeEditors: Record<string, { userId: number; userName: string }[]>;
}

// Define the hook for using WebSocket connection
export function useWebSocket(): UseWebSocketResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [activeEditors, setActiveEditors] = useState<Record<string, { userId: number; userName: string }[]>>({});
  
  // Use a ref to keep the socket instance
  const socketRef = useRef<WebSocket | null>(null);
  
  // Function to get the WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = `${protocol}//${window.location.host}/ws`;
    
    // Add authentication parameters if user is logged in
    if (user) {
      return `${baseUrl}?userId=${user.id}&token=placeholder`;
    }
    
    return baseUrl;
  }, [user]);
  
  // Function to set up the WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!user) return;
    
    try {
      setConnecting(true);
      
      // Close existing connection if any
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      // Create new connection
      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;
      
      // Set up event handlers
      socket.onopen = () => {
        setConnected(true);
        setConnecting(false);
        console.log('WebSocket connection established');
      };
      
      socket.onclose = () => {
        setConnected(false);
        setConnecting(false);
        console.log('WebSocket connection closed');
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnecting(false);
        toast({
          title: 'Connection Error',
          description: 'Could not establish real-time connection. Collaborative features may be limited.',
          variant: 'destructive',
        });
      };
      
      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Add the message to our list
          setMessages(prev => [...prev, message]);
          
          // Handle different message types
          switch (message.type) {
            case 'ERROR':
              toast({
                title: 'Error',
                description: message.error || 'Unknown error',
                variant: 'destructive',
              });
              break;
              
            case 'EDIT_TRANSLATION':
              if (message.keyId && message.languageId && message.userId && message.userName) {
                const key = `${message.keyId}-${message.languageId}`;
                
                setActiveEditors(prev => {
                  const editors = [...(prev[key] || [])];
                  
                  // Check if the user is already in the list
                  const existingIndex = editors.findIndex(e => e.userId === message.userId);
                  
                  if (existingIndex >= 0) {
                    // Update existing entry
                    editors[existingIndex] = { userId: message.userId!, userName: message.userName! };
                  } else {
                    // Add new entry
                    editors.push({ userId: message.userId!, userName: message.userName! });
                  }
                  
                  return { ...prev, [key]: editors };
                });
              }
              break;
              
            case 'LEAVE_PROJECT':
              if (message.userId) {
                // Remove this user from all active editors
                setActiveEditors(prev => {
                  const newEditors = { ...prev };
                  
                  // Loop through all translation keys
                  Object.keys(newEditors).forEach(key => {
                    newEditors[key] = newEditors[key].filter(editor => editor.userId !== message.userId);
                    
                    // Remove the key if no editors left
                    if (newEditors[key].length === 0) {
                      delete newEditors[key];
                    }
                  });
                  
                  return newEditors;
                });
              }
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setConnecting(false);
    }
  }, [user, getWebSocketUrl, toast]);
  
  // Set up WebSocket when user logs in or changes
  useEffect(() => {
    if (user) {
      setupWebSocket();
    } else {
      // Close existing connection if user logs out
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnected(false);
    }
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user, setupWebSocket]);
  
  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, unable to send message');
    }
  }, []);
  
  // Utility functions for common message types
  const joinProject = useCallback((projectId: number) => {
    sendMessage({
      type: 'JOIN_PROJECT',
      projectId,
      timestamp: Date.now(),
    });
  }, [sendMessage]);
  
  const leaveProject = useCallback(() => {
    sendMessage({
      type: 'LEAVE_PROJECT',
      timestamp: Date.now(),
    });
  }, [sendMessage]);
  
  const editTranslation = useCallback((keyId: number, languageId: number, value: string) => {
    sendMessage({
      type: 'EDIT_TRANSLATION',
      keyId,
      languageId,
      value,
      timestamp: Date.now(),
    });
  }, [sendMessage]);
  
  const approveTranslation = useCallback((keyId: number, languageId: number, isApproved: boolean) => {
    sendMessage({
      type: 'APPROVE_TRANSLATION',
      keyId,
      languageId,
      isApproved,
      timestamp: Date.now(),
    });
  }, [sendMessage]);
  
  return {
    connected,
    connecting,
    sendMessage,
    messages,
    joinProject,
    leaveProject,
    editTranslation,
    approveTranslation,
    activeEditors,
  };
}