import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chat, ChatMessage } from '@/lib/types';
import { getChatsForUser, getMessagesForChat, subscribeToBlockStatus } from '@/lib/services';

export function useChats(userId: string | null | undefined, isAdmin: boolean = false) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId && !isAdmin) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = getChatsForUser(isAdmin ? undefined : (userId ?? undefined), (loadedChats) => {
            setChats(loadedChats);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, isAdmin]);

    return { chats, isLoading };
}

export function useChatMessages(chatId: string | undefined) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        const unsubscribe = getMessagesForChat(chatId, (loadedMessages) => {
            setMessages(loadedMessages);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    return { messages, isLoading };
}

export function useBlockStatus(userId: string | null | undefined, otherUserId: string | undefined) {
    const [status, setStatus] = useState({ youBlockedOther: false, blockedByOther: false });

    useEffect(() => {
        if (!userId || !otherUserId) return;

        const unsubscribe = subscribeToBlockStatus(userId, otherUserId, (newStatus) => {
            setStatus(newStatus);
        });

        return () => unsubscribe();
    }, [userId, otherUserId]);

    return status;
}
