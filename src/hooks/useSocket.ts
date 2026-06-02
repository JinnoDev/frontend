'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';

export function useSocket(token: string | null) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = io(`${SOCKET_URL}/chats`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    const joinChat = useCallback((chatId: string) => {
        socketRef.current?.emit('joinChat', chatId);
    }, []);

    const leaveChat = useCallback((chatId: string) => {
        socketRef.current?.emit('leaveChat', chatId);
    }, []);

    const sendMessage = useCallback((chatId: string, content: string) => {
        socketRef.current?.emit('sendMessage', { chatId, content });
    }, []);

    const onNewMessage = useCallback((handler: (msg: any) => void) => {
        socketRef.current?.on('newMessage', handler);
        return () => { socketRef.current?.off('newMessage', handler); };
    }, []);

    const onChatUpdated = useCallback((handler: (data: any) => void) => {
        socketRef.current?.on('chatUpdated', handler);
        return () => { socketRef.current?.off('chatUpdated', handler); };
    }, []);

    return { joinChat, leaveChat, sendMessage, onNewMessage, onChatUpdated };
}