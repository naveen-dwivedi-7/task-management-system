import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';

type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
};

type WebSocketProviderProps = {
  children: ReactNode;
};

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Connect to the WebSocket server
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    // Event listeners
    newSocket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Authenticate the connection with user ID if logged in
      if (user) {
        newSocket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      }
    });

    newSocket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        setLastMessage(message);
        
        // Handle different message types
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    newSocket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    });

    newSocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    }
  }, [socket, user]);

  // Handle different types of WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'welcome':
        console.log('Connected to WebSocket server');
        break;
        
      case 'auth_success':
        console.log('WebSocket authentication successful');
        break;
        
      case 'notification':
        // Display a toast notification
        toast({
          title: message.data.title || 'New Notification',
          description: message.data.message,
          variant: 'default'
        });
        
        // Invalidate notifications queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
        break;
        
      case 'task_update':
        // Handle task updates by invalidating relevant queries
        switch (message.data.action) {
          case 'created':
          case 'updated':
          case 'status_updated':
          case 'assignee_updated':
          case 'deleted':
            // Invalidate task-related queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/tasks/assigned'] });
            queryClient.invalidateQueries({ queryKey: ['/api/tasks/created'] });
            queryClient.invalidateQueries({ queryKey: ['/api/tasks/overdue'] });
            queryClient.invalidateQueries({ queryKey: ['/api/tasks/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/team/stats'] });
            break;
            
          default:
            console.log('Unknown task update action:', message.data.action);
        }
        break;
        
      default:
        console.log('Unhandled WebSocket message type:', message.type);
    }
  };

  // Function to send messages to the WebSocket server
  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        lastMessage,
        sendMessage
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}