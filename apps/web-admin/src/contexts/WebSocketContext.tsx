import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '../components/ui';

interface NotificationMessage {
    event_type: string;
    payload: any;
}

interface WebSocketContextType {
    isConnected: boolean;
    lastMessage: NotificationMessage | null;
    sendMessage: (msg: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<NotificationMessage | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<number | undefined>(undefined);
    const { info } = useToast();

    const connect = useCallback(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const rawEnvUrl = import.meta.env.VITE_WS_URL;
        let wsUrl: string;
        if (rawEnvUrl && (rawEnvUrl.startsWith('ws://') || rawEnvUrl.startsWith('wss://'))) {
            if (window.location.protocol === 'https:' && rawEnvUrl.startsWith('ws://')) {
                wsUrl = rawEnvUrl.replace(/^ws:\/\//, 'wss://');
            } else {
                wsUrl = rawEnvUrl;
            }
        } else {
            const path = (rawEnvUrl && rawEnvUrl.startsWith('/')) ? rawEnvUrl : '/ws';
            wsUrl = `${protocol}//${host}${path}`;
        }

        // Close existing if any
        if (ws.current) {
            ws.current.onclose = null;
            ws.current.onerror = null;
            ws.current.onopen = null;
            ws.current.close();
        }

        try {
            const socket = new WebSocket(wsUrl);
            ws.current = socket;

            socket.onopen = () => {
                if (socket !== ws.current) return;
                setIsConnected(true);
            };

            socket.onclose = () => {
                if (socket !== ws.current) return;
                setIsConnected(false);
                reconnectTimeout.current = window.setTimeout(() => {
                    connect();
                }, 5000);
            };

            socket.onerror = () => {
                if (socket !== ws.current) return;
            };

            socket.onmessage = (event) => {
                if (socket !== ws.current) return;
                try {
                const data = JSON.parse(event.data);
                if (data.event_type) {
                    setLastMessage(data); // Trigger updates
                    handleGlobalNotification(data);
                }
                } catch (e) {
                    console.error('WS Parse Error', e);
                }
            };
        } catch (err) {
            console.warn('WebSocket init failed:', err);
            reconnectTimeout.current = window.setTimeout(() => {
                connect();
            }, 5000);
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) ws.current.close();
            clearTimeout(reconnectTimeout.current);
        };
    }, [connect]);

    const sendMessage = useCallback((msg: any) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(msg));
        }
    }, []);

    const handleGlobalNotification = (msg: NotificationMessage) => {
        // Example global toast for critical events
        if (msg.event_type === 'WORK_ORDER_COMPLETED') {
            info(`WO #${msg.payload.id} was completed`, 'Work Order Completed');
        }
    };

    return (
        <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
