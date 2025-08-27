

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, SendHorizonal, Loader2, FileQuestion, ArrowLeft, Calendar, Users, Phone, PencilRuler, Check, CreditCard, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import type { Chat, ChatMessage, ForwardedItem, LineItem, QuoteRequest, ChatParticipant } from '@/lib/types';
import { getChatsForUser, getMessagesForChat, sendMessage, markChatAsRead, approveQuote } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import { parseForwardedMessage } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

function ForwardedItemBubble({ item }: { item: ForwardedItem }) {
    if (!item.itemId || !item.itemType) {
        return null;
    }
    return (
        <div className="bg-background border-2 border-primary/30 rounded-lg p-3 max-w-xs w-full shadow-md">
            <Link href={`/client/${item.itemType}/${item.itemId}`} className="block">
                <div className="relative aspect-video rounded-md overflow-hidden mb-2">
                    <Image src={item.image!} alt={item.title} layout="fill" className="object-cover" />
                </div>
                <h4 className="font-bold text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground">by {item.vendorName}</p>
                <p className="text-sm font-semibold text-primary mt-1">
                    {item.price ? `$${item.price}` : 'Custom Quote'}
                </p>
            </Link>
                <div className="mt-3 bg-muted rounded-md p-2 border border-primary/20">
                <p className="text-sm text-foreground">{item.userMessage}</p>
            </div>
        </div>
    )
}

function QuoteRequestBubble({ item }: { item: ForwardedItem }) {
    return (
    <div className="bg-background border-2 border-primary/40 rounded-lg p-4 max-w-md w-full shadow-lg">
            <div className="flex items-center gap-3 mb-3 border-b pb-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                    <PencilRuler className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Quote Request</h3>
                    <p className="text-sm text-muted-foreground">For "{item.title}"</p>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                    <p className="text-muted-foreground font-medium w-24">Message</p>
                    <p className="flex-1">"{item.userMessage}"</p>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p><span className="text-muted-foreground">Event Date:</span> {item.eventDate ? format(new Date(item.eventDate), 'PPP') : 'Not specified'}</p>
                </div>
                 <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p><span className="text-muted-foreground">Guests:</span> ~{item.guestCount || 'Not specified'}</p>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p><span className="text-muted-foreground">Contact:</span> {item.phone || 'Not provided'}</p>
                </div>
            </div>
             <Link href="/vendor/client-requests">
                <Button className="w-full mt-4">
                    Respond to Request
                </Button>
            </Link>
        </div>
    )
}


function QuoteResponseBubble({ item, isOwnMessage }: { item: ForwardedItem, isOwnMessage: boolean }) {
  const { toast } = useToast();
  const [isPaying, setIsPaying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    if (!item.quoteRequestId) return;
    setIsPaying(true);
    try {
        await approveQuote(item.quoteRequestId);
        toast({
            title: "Quote Approved & Booked!",
            description: "A booking has been created and the vendor has been notified.",
        });
        setIsApproved(true);
    } catch(error) {
        console.error("Failed to approve quote:", error);
        toast({ title: "Error", description: "Could not approve the quote.", variant: "destructive" });
    } finally {
        setIsPaying(false);
    }
  }

    return (
        <div className="bg-background border-2 border-primary/30 rounded-lg p-4 max-w-md w-full shadow-lg">
      <div className="flex items-center gap-3 mb-3 border-b pb-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-600/10 text-green-700">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{item.title}</h3>
          <p className="text-sm text-muted-foreground">From {item.vendorName}</p>
        </div>
      </div>
    <div className="space-y-1 my-3 border-t border-primary/10 pt-3">
        {item.lineItems?.map((line, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <p>{line.description}</p>
            <p className="font-medium">${line.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <Separator />
    <div className="flex justify-between items-center font-bold text-lg my-2 border-t border-primary/10 pt-2">
        <p>Total</p>
        <p>${item.total?.toFixed(2)}</p>
      </div>
      {item.userMessage && (
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
            <p>"{item.userMessage}"</p>
        </div>
      )}
      {!isOwnMessage && (
        <Button className="w-full mt-4" onClick={handleApprove} disabled={isPaying || isApproved}>
          {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          {isApproved ? 'Approved & Booked' : `Pay & Confirm Booking`}
        </Button>
      )}
    </div>
  );
}


function ChatBubble({ message, isOwnMessage, chat, role }: { message: ChatMessage; isOwnMessage: boolean, chat: Chat | null, role: 'client' | 'vendor' | 'admin' | null }) {
    const { userId } = useAuth();
    
    const sender = chat?.participants.find(p => p.id === message.senderId);
    const otherParticipant = chat?.participants.find(p => p.id !== (role === 'admin' ? sender?.id : userId));


    const forwardedItem = parseForwardedMessage(message.text);

    if (forwardedItem) {
        if(forwardedItem.isQuoteResponse) {
             return (
                 <div className="flex justify-start w-full">
                     <QuoteResponseBubble item={forwardedItem} isOwnMessage={isOwnMessage} />
                </div>
            )
        }
         if (forwardedItem.isQuoteRequest && !isOwnMessage) {
            return (
                <div className="flex justify-start w-full">
                     <QuoteRequestBubble item={forwardedItem} />
                </div>
            )
        }
        return (
             <div className={cn("flex items-end gap-2", isOwnMessage && "justify-end")}>
                 {!isOwnMessage && (
                    <Link href={`/vendor/${otherParticipant?.id}`}>
                        <Avatar className="h-8 w-8 self-start">
                            <AvatarImage src={otherParticipant?.avatar} />
                            <AvatarFallback>{otherParticipant?.name?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                    </Link>
                )}
                <ForwardedItemBubble item={forwardedItem} />
             </div>
        )
    }

    return (
        <div className={cn("flex items-end gap-2", isOwnMessage && "justify-end")}>
            {!isOwnMessage && (
                 <Link href={`/vendor/${otherParticipant?.id}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.avatar} />
                        <AvatarFallback>{sender?.name?.substring(0,2)}</AvatarFallback>
                    </Avatar>
                </Link>
            )}
                <div
                className={cn(
                    "max-w-xs rounded-lg p-3 whitespace-pre-wrap border",
                    isOwnMessage ? "bg-primary text-primary-foreground border-primary/40" : "bg-muted border-primary/10"
                )}
            >
                <p className="text-sm">{message.text}</p>
            </div>
            {isOwnMessage && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={sender?.avatar} />
                    <AvatarFallback>{sender?.name?.substring(0,2)}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}


export function MessagingPanel() {
  const { userId, role } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isAdmin = role === 'admin';

  useEffect(() => {
    // Admins don't need a user ID to fetch all chats
    if (!userId && !isAdmin) return;

    setIsLoading(true);
    const unsubscribe = getChatsForUser(isAdmin ? undefined : userId, (loadedChats) => {
        setChats(loadedChats);
        if (!isMobile && !selectedChat && loadedChats.length > 0) {
            handleSelectChat(loadedChats[0]);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, selectedChat, isMobile, isAdmin]);


  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = getMessagesForChat(selectedChat.id, (loadedMessages) => {
        setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    if (userId) {
      markChatAsRead(chat.id, userId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedChat || !newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage('');
    await sendMessage(selectedChat.id, userId, textToSend);
  };
  
  const getOtherParticipant = (chat: Chat) => {
      if (isAdmin) {
          // For admin view, we just show both participants
          return {
              p1: chat.participants[0],
              p2: chat.participants[1],
          }
      }
      return chat.participants.find(p => p.id !== userId);
  }

  const renderLastMessage = (chat: Chat) => {
    const forwarded = parseForwardedMessage(chat.lastMessage);
    const sender = chat.lastMessageSenderId === userId ? 'You: ' : '';
    const isUnread = (chat.unreadCount?.[userId || ''] || 0) > 0;

    if (forwarded) {
        if (forwarded.isQuoteResponse) {
             return (
                 <span className={cn("flex items-center gap-1.5", isUnread && 'text-foreground font-medium')}>
                    {sender} <Check className="h-4 w-4 text-green-600" /> Quote Response Sent
                </span>
            )
        }
        if(forwarded.isQuoteRequest) {
            return (
                 <span className={cn("flex items-center gap-1.5", isUnread && 'text-foreground font-medium')}>
                    {sender} <PencilRuler className="h-4 w-4" /> Quote Request
                </span>
            )
        }
        return (
            <span className={cn("flex items-center gap-1.5", isUnread && 'text-foreground font-medium')}>
                {sender} <FileQuestion className="h-4 w-4" /> Inquiry about service
            </span>
        )
    }

    return (
         <span className={cn("truncate", isUnread && 'text-foreground font-medium')}>
            {sender}{chat.lastMessage}
        </span>
    );
  }

  const showChatList = !isMobile || (isMobile && !selectedChat);
  const showChatWindow = !isMobile || (isMobile && selectedChat);
  const currentOtherParticipant = selectedChat ? getOtherParticipant(selectedChat) as ChatParticipant : null;


  return (
    <div className="flex h-full flex-col">
       {!isAdmin && (
        <div className="flex-shrink-0 border-b p-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10" />
            </div>
        </div>
       )}
      <div className="flex flex-grow overflow-hidden">
        <aside className={cn(
            "h-full w-full flex-col border-r sm:flex",
            isAdmin ? "sm:w-1/2 md:w-1/3" : "sm:w-1/3",
            showChatList ? 'flex' : 'hidden'
        )}>
            <ScrollArea>
            <div className="flex flex-col">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : chats.length > 0 ? (
                    chats.map((chat) => {
                        const otherParticipant = getOtherParticipant(chat);
                        const unreadForUser = chat.unreadCount?.[userId || ''] || 0;
                        const p = Array.isArray(otherParticipant) ? otherParticipant[0] : otherParticipant;
                        return (
                            <button
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                className={cn(
                                'flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 w-full',
                                selectedChat?.id === chat.id && 'bg-muted'
                                )}
                            >
                                <Avatar className="h-10 w-10">
                                <AvatarImage src={p?.avatar} alt={p?.name} />
                                <AvatarFallback>{p?.name?.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <p className="font-semibold truncate">{Array.isArray(otherParticipant) ? `${otherParticipant.p1.name} & ${otherParticipant.p2.name}` : otherParticipant?.name}</p>
                                            {p?.verification === 'verified' && <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                            {p?.verification === 'trusted' && <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatDistanceToNow(chat.lastMessageTimestamp, { addSuffix: true })}</p>
                                    </div>
                                    <p className="text-sm truncate text-muted-foreground">
                                    {renderLastMessage(chat)}
                                    </p>
                                </div>
                                {unreadForUser > 0 && !isAdmin && (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                        {unreadForUser}
                                    </div>
                                )}
                            </button>
                        )
                    })
                ) : (
                    <p className="p-4 text-center text-muted-foreground">No conversations yet.</p>
                )}
            </div>
            </ScrollArea>
        </aside>

        <div className={cn(
            "flex-grow flex-col h-full bg-slate-50",
            showChatWindow ? 'flex' : 'hidden sm:flex'
            )}>
            {selectedChat ? (
                <>
                <div className="flex-shrink-0 border-b p-4 flex items-center gap-3 bg-background">
                    <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSelectedChat(null)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                     <Avatar className="h-10 w-10">
                        <AvatarImage src={currentOtherParticipant?.avatar} alt={currentOtherParticipant?.name} />
                        <AvatarFallback>{currentOtherParticipant?.name?.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                         <div className="flex items-center gap-1.5">
                            <p className="font-semibold">{isAdmin ? `${(getOtherParticipant(selectedChat) as any).p1.name} & ${(getOtherParticipant(selectedChat) as any).p2.name}` : currentOtherParticipant?.name}</p>
                            {currentOtherParticipant?.verification === 'verified' && <ShieldCheck className="h-4 w-4 text-green-600" />}
                            {currentOtherParticipant?.verification === 'trusted' && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                </div>
                <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4">
                    {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} isOwnMessage={message.senderId === userId} chat={selectedChat} role={role} />
                    ))}
                    </div>
                </ScrollArea>
                <div className="flex-shrink-0 border-t p-4 bg-background">
                    {isAdmin ? (
                         <div className="text-center text-sm text-muted-foreground">Admin view is read-only</div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="relative">
                            <Input 
                                placeholder="Type a message..." 
                                className="pr-12"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <Button type="submit" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2">
                                <SendHorizonal className="h-4 w-4" />
                            </Button>
                        </form>
                    )}
                </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <p>Select a chat to start messaging.</p>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
