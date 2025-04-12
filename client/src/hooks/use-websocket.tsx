import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type MessageType = 
  | 'JOIN_PROJECT'
  | 'LEAVE_PROJECT'
  | 'EDIT_TRANSLATION'
  | 'APPROVE_TRANSLATION'
  | 'SYNC_STATUS'
  | 'ERROR';

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

export function useWebSocket(): UseWebSocketResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [activeEditors, setActiveEditors] = useState<Record<string, { userId: number; userName: string }[]>>({});
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    function connect() {
      try {
        setConnecting(true);
        
        // Create WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setConnected(true);
          setConnecting(false);
          reconnectAttempts.current = 0;
          
          // Send auth message
          if (user) {
            const authMessage: WebSocketMessage = {
              type: 'JOIN_PROJECT',
              userId: user.id,
              userName: user.username
            };
            ws.send(JSON.stringify(authMessage));
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
            
            // Handle different message types
            switch (message.type) {
              case 'EDIT_TRANSLATION':
                handleEditTranslation(message);
                break;
              case 'ERROR':
                toast({
                  title: 'WebSocket Error',
                  description: message.error || 'An error occurred in the WebSocket connection.',
                  variant: 'destructive'
                });
                break;
              default:
                break;
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
        
        ws.onclose = () => {
          setConnected(false);
          setConnecting(false);
          
          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
            
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            toast({
              title: 'Connection Lost',
              description: 'Unable to reconnect to the collaboration server. Please refresh the page.',
              variant: 'destructive'
            });
          }
        };
        
        ws.onerror = () => {
          // WebSocket API doesn't provide error details due to security restrictions
          setConnected(false);
        };
        
        setSocket(ws);
        
        // Cleanup on unmount
        return () => {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        console.error('Error establishing WebSocket connection:', err);
        setConnecting(false);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the real-time collaboration server.',
          variant: 'destructive'
        });
      }
    }
    
    connect();
  }, [user, toast]);
  
  // Handle edit translation messages
  const handleEditTranslation = useCallback((message: WebSocketMessage) => {
    if (!message.keyId || !message.languageId || !message.userId || !message.userName) return;
    
    // Create unique key for this translation
    const translationKey = `${message.keyId}-${message.languageId}`;
    
    setActiveEditors(prev => {
      const editors = [...(prev[translationKey] || [])];
      
      // Check if this user is already in the editors list
      const existingIndex = editors.findIndex(e => e.userId === message.userId);
      
      if (existingIndex >= 0) {
        // Update existing editor
        editors[existingIndex] = { 
          userId: message.userId!, 
          userName: message.userName! 
        };
      } else {
        // Add new editor
        editors.push({ 
          userId: message.userId!, 
          userName: message.userName! 
        });
      }
      
      return {
        ...prev,
        [translationKey]: editors
      };
    });
    
    // Remove editors after 5 seconds of inactivity
    setTimeout(() => {
      setActiveEditors(prev => {
        const editors = [...(prev[translationKey] || [])];
        const filteredEditors = editors.filter(e => e.userId !== message.userId);
        
        if (filteredEditors.length === 0) {
          const newState = { ...prev };
          delete newState[translationKey];
          return newState;
        }
        
        return {
          ...prev,
          [translationKey]: filteredEditors
        };
      });
    }, 5000);
  }, []);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, unable to send message');
    }
  }, [socket]);
  
  // Join a project for collaboration
  const joinProject = useCallback((projectId: number) => {
    if (!user) return;
    
    sendMessage({
      type: 'JOIN_PROJECT',
      projectId,
      userId: user.id,
      userName: user.username
    });
  }, [user, sendMessage]);
  
  // Leave the current project
  const leaveProject = useCallback(() => {
    if (!user) return;
    
    sendMessage({
      type: 'LEAVE_PROJECT',
      userId: user.id
    });
  }, [user, sendMessage]);
  
  // Send edit translation update
  const editTranslation = useCallback((keyId: number, languageId: number, value: string) => {
    if (!user) return;
    
    sendMessage({
      type: 'EDIT_TRANSLATION',
      keyId,
      languageId,
      value,
      userId: user.id,
      userName: user.username,
      timestamp: Date.now()
    });
  }, [user, sendMessage]);
  
  // Send translation approval status
  const approveTranslation = useCallback((keyId: number, languageId: number, isApproved: boolean) => {
    if (!user) return;
    
    sendMessage({
      type: 'APPROVE_TRANSLATION',
      keyId,
      languageId,
      isApproved,
      userId: user.id,
      userName: user.username
    });
  }, [user, sendMessage]);
  
  return {
    connected,
    connecting,
    sendMessage,
    messages,
    joinProject,
    leaveProject,
    editTranslation,
    approveTranslation,
    activeEditors
  };
}