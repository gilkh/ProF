

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, SendHorizonal, Loader2, FileQuestion, ArrowLeft, Calendar, Users, Phone, PencilRuler, Check, CreditCard, ShieldCheck, FileText, MoreVertical, Flag, Ban, Unlock } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import type { Chat, ChatMessage, ForwardedItem, LineItem, QuoteRequest, ChatParticipant, QuestionTemplateMessage } from '@/lib/types';
import { getChatsForUser, getMessagesForChat, sendMessage, markChatAsRead, approveQuote, subscribeToBlockStatus, blockUser, unblockUser, reportUser } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import { parseForwardedMessage, parseQuestionTemplateMessage, parseTemplateResponseMessage, parseMeetingProposalMessage, parseMeetingStatusMessage, parsePortfolioMentionMessage } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { QuestionTemplateBubble, TemplateResponseBubble } from './question-template-bubble';
import { MeetingProposalBubble, MeetingStatusBubble } from './meeting-proposal-bubble';
import { PortfolioMentionBubble } from './portfolio-mention-bubble';
import { MeetingRequestDialog } from './meeting-request-dialog';
import { QuestionTemplateSelector } from './question-template-selector';
import { PortfolioMentionDialog } from './portfolio-mention-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

function ForwardedItemBubble({ item, timestamp }: { item: ForwardedItem, timestamp?: Date }) {
    if (!item.itemId || !item.itemType) {
        return null;
    }
    return (
    <div className="bg-background border-2 border-primary/30 rounded-lg p-3 w-full max-w-[70.3125%] shadow-md overflow-hidden">
            <Link href={`/client/${item.itemType}/${item.itemId}`} className="block w-full max-w-full overflow-hidden">
                <div className="relative aspect-video rounded-md overflow-hidden mb-2">
                    <Image src={item.image!} alt={item.title} layout="fill" className="object-cover" />
                </div>
                <h4 className="font-bold text-sm break-words break-all">{item.title}</h4>
                <p className="text-xs text-muted-foreground break-words">by {item.vendorName}</p>
                <p className="text-sm font-semibold text-primary mt-1 break-words">
                    {item.price ? `${item.price}` : 'Custom Quote'}
                </p>
            </Link>
                <div className="mt-3 bg-muted rounded-md p-2 border border-primary/20 overflow-hidden">
                <p className="text-sm text-foreground break-words break-all overflow-hidden">{item.userMessage}</p>
            </div>
            {timestamp && (
                <div className="mt-2 text-xs text-muted-foreground text-right">{format(new Date(timestamp), 'p')}</div>
            )}
        </div>
    )
}

function QuoteRequestBubble({ item, timestamp }: { item: ForwardedItem, timestamp?: Date }) {
    return (
    <div className="bg-background border-2 border-primary/40 rounded-lg p-4 w-full max-w-[70.3125%] shadow-lg overflow-hidden">
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
                    <p className="flex-1 break-words break-all overflow-hidden">"{item.userMessage}"</p>
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
            {timestamp && (
                <div className="mt-3 text-xs text-muted-foreground text-right">{format(new Date(timestamp), 'p')}</div>
            )}
        </div>
    )
}


function QuoteResponseBubble({ item, isOwnMessage, timestamp }: { item: ForwardedItem, isOwnMessage: boolean, timestamp?: Date }) {
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
        <div className="bg-background border-2 border-primary/30 rounded-lg p-4 w-full max-w-[70.3125%] shadow-lg overflow-hidden">
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
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md overflow-hidden">
            <p className="break-words break-all overflow-hidden">"{item.userMessage}"</p>
        </div>
      )}
      {!isOwnMessage && (
        <Button className="w-full mt-4" onClick={handleApprove} disabled={isPaying || isApproved}>
          {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          {isApproved ? 'Approved & Booked' : `Pay & Confirm Booking`}
        </Button>
      )}
            {timestamp && (
                <div className="mt-3 text-xs text-muted-foreground text-right">{format(new Date(timestamp), 'p')}</div>
            )}
    </div>
  );
}


function ChatBubble({ message, isOwnMessage, chat, role }: { message: ChatMessage; isOwnMessage: boolean, chat: Chat | null, role: 'client' | 'vendor' | 'admin' | null }) {
    const { userId } = useAuth();
    
    const sender = chat?.participants.find(p => p.id === message.senderId);
    const otherParticipant = chat?.participants.find(p => p.id !== (role === 'admin' ? sender?.id : userId));

    // Check for question template message
    const templateMessage = parseQuestionTemplateMessage(message.text);
    if (templateMessage) {
        return (
            <div className={cn('flex w-full min-w-0 overflow-hidden', isOwnMessage ? 'justify-end' : 'justify-start')}>
                <QuestionTemplateBubble 
                    templateMessage={templateMessage}
                    chatId={chat?.id || ''}
                    isOwnMessage={isOwnMessage}
                    timestamp={message.timestamp}
                    onResponseSubmitted={() => {
                        // Messages will update automatically via real-time listener
                        // No need to refresh the page
                    }}
                />
            </div>
        );
    }

    // Check for template response message
    const responseMessage = parseTemplateResponseMessage(message.text);
    if (responseMessage) {
        return (
            <div className={cn('flex w-full min-w-0 overflow-hidden', isOwnMessage ? 'justify-end' : 'justify-start')}>
                <TemplateResponseBubble 
                    responseData={responseMessage}
                    isOwnMessage={isOwnMessage}
                    timestamp={message.timestamp}
                />
            </div>
        );
    }

    // Check for meeting proposal
    const meetingProposal = parseMeetingProposalMessage(message.text);
    if (meetingProposal) {
        return (
            <div className={cn('flex w-full min-w-0 overflow-hidden', isOwnMessage ? 'justify-end' : 'justify-start')}>
                <MeetingProposalBubble 
                    message={message}
                    isOwnMessage={isOwnMessage}
                />
            </div>
        );
    }

    // Check for meeting status update
    const meetingStatus = parseMeetingStatusMessage(message.text);
    if (meetingStatus) {
        return (
            <div className={cn('flex w-full min-w-0 overflow-hidden', isOwnMessage ? 'justify-end' : 'justify-start')}>
                <MeetingStatusBubble 
                    message={message}
                />
            </div>
        );
    }

    // Check for portfolio mention
    const portfolioMention = parsePortfolioMentionMessage(message.text);
    if (portfolioMention) {
        return (
            <div className={cn('flex w-full min-w-0 overflow-hidden', isOwnMessage ? 'justify-end' : 'justify-start')}>
                <PortfolioMentionBubble data={portfolioMention} isOwnMessage={isOwnMessage} timestamp={message.timestamp} />
            </div>
        );
    }

    const forwardedItem = parseForwardedMessage(message.text);

    if (forwardedItem) {
        if(forwardedItem.isQuoteResponse) {
             return (
                 <div className={cn('flex w-full min-w-0 overflow-hidden', isOwnMessage ? 'justify-end' : 'justify-start')}>
                     <QuoteResponseBubble item={forwardedItem} isOwnMessage={isOwnMessage} timestamp={message.timestamp} />
                </div>
            )
        }
         if (forwardedItem.isQuoteRequest && !isOwnMessage) {
            return (
                <div className="flex justify-start w-full min-w-0 overflow-hidden">
                     <QuoteRequestBubble item={forwardedItem} timestamp={message.timestamp} />
                </div>
            )
        }
        return (
             <div className={cn("flex items-end gap-2 min-w-0 w-full overflow-hidden", isOwnMessage && "justify-end")}> 
                 {!isOwnMessage && (
                    (role === 'client' && otherParticipant?.id) ? (
                      <Link href={`/vendor/${otherParticipant.id}`}>
                        <Avatar className="h-8 w-8 self-start flex-shrink-0">
                            <AvatarImage src={otherParticipant?.avatar} />
                            <AvatarFallback>{otherParticipant?.name?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-8 w-8 self-start flex-shrink-0">
                          <AvatarImage src={otherParticipant?.avatar} />
                          <AvatarFallback>{otherParticipant?.name?.substring(0,2)}</AvatarFallback>
                      </Avatar>
                    )
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <ForwardedItemBubble item={forwardedItem} timestamp={message.timestamp} />
                </div>
             </div>
        )
    }

    return (
        <div className={cn("flex items-end gap-2 min-w-0 w-full overflow-hidden", isOwnMessage && "justify-end")}> 
            {!isOwnMessage && (
                (role === 'client' && otherParticipant?.id) ? (
                  <Link href={`/vendor/${otherParticipant.id}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={sender?.avatar} />
                        <AvatarFallback>{sender?.name?.substring(0,2)}</AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={sender?.avatar} />
                      <AvatarFallback>{sender?.name?.substring(0,2)}</AvatarFallback>
                  </Avatar>
                )
            )}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                        className={cn(
                            "w-full max-w-[70.3125%] rounded-lg p-3 whitespace-pre-wrap break-words border relative",
                            isOwnMessage ? "bg-primary text-primary-foreground border-primary/40" : "bg-muted border-primary/10"
                        )}
                    >
                        <p className="text-sm break-all sm:break-words">{message.text}</p>
                        <div className="mt-1 text-xs text-muted-foreground text-right">{format(new Date(message.timestamp), 'p')}</div>
                    </div>
                </div>
            {isOwnMessage && (
                <Avatar className="h-8 w-8 hidden sm:block flex-shrink-0">
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
  const { toast } = useToast();

  const [blockedByOther, setBlockedByOther] = useState(false);
  const [youBlockedOther, setYouBlockedOther] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportComment, setReportComment] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);

  useEffect(() => {
    // Admins don't need a user ID to fetch all chats
    if (!userId && !isAdmin) return;

    setIsLoading(true);
    const unsubscribe = getChatsForUser(isAdmin ? undefined : (userId ?? undefined), (loadedChats) => {
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

  // Subscribe to block status for current conversation
  useEffect(() => {
    if (!selectedChat || !userId || isAdmin) return;
    const other = getOtherParticipant(selectedChat) as ChatParticipant | undefined;
    if (!other?.id) return;
    const unsub = subscribeToBlockStatus(userId, other.id, ({ youBlockedOther, blockedByOther }) => {
      setYouBlockedOther(youBlockedOther);
      setBlockedByOther(blockedByOther);
    });
    return () => unsub();
  }, [selectedChat, userId, isAdmin]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      const el = viewport ?? (scrollAreaRef.current as unknown as HTMLElement);
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
    try {
      await sendMessage(selectedChat.id, userId, textToSend);
    } catch (err: any) {
      // Restore text so it isn't lost
      setNewMessage(textToSend);
      const msg = (err && typeof err.message === 'string') ? err.message : '';
      if (msg === 'blocked_by_recipient') {
        toast({ title: 'Cannot send message', description: 'You have been blocked by this user.', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to send message', description: 'Please try again.', variant: 'destructive' });
      }
    }
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

    const meeting = parseMeetingProposalMessage(chat.lastMessage) || parseMeetingStatusMessage(chat.lastMessage);
    if (meeting) {
        return (
            <span className={cn('flex items-center gap-1.5', isUnread && 'text-foreground font-medium')}>
                {sender} <Calendar className="h-4 w-4" /> Meeting update
            </span>
        );
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
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
       {!isAdmin && (
        <div className="flex-shrink-0 border-b p-3 sm:p-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <div className="relative mt-4 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10" />
            </div>
        </div>
       )}
      <div className="flex flex-grow overflow-hidden min-w-0 w-full">
        <aside className={cn(
            "h-full w-full flex-col border-r sm:flex min-w-0",
            isAdmin ? "sm:w-1/2 md:w-1/3" : "sm:w-1/3",
            showChatList ? 'flex' : 'hidden'
        )}>
            <ScrollArea className="pb-0 sm:pb-0">
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
                        const unreadForUser = chat.unreadCount?.[userId ?? ''] || 0;
                        const p = otherParticipant && typeof otherParticipant === 'object' && 'p1' in otherParticipant ? otherParticipant.p1 : (otherParticipant as ChatParticipant | undefined);
                        return (
                            <button
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                className={cn(
                                'flex items-center gap-3 p-3 sm:p-4 text-left transition-colors hover:bg-muted/50 w-full',
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
                                            <p className="font-semibold truncate">{otherParticipant && typeof otherParticipant === 'object' && 'p1' in otherParticipant ? `${otherParticipant.p1.name} & ${otherParticipant.p2.name}` : (otherParticipant as ChatParticipant | undefined)?.name}</p>
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
            "flex-grow flex-col h-full bg-slate-50 min-h-0 min-w-0 w-full max-w-full",
            showChatWindow ? 'flex' : 'hidden sm:flex'
            )}>
            {selectedChat ? (
                <>
                <div className="flex-shrink-0 border-b p-4 flex items-center gap-3 bg-background">
                    <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSelectedChat(null)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {(role === 'client' && !isAdmin && currentOtherParticipant?.id) ? (
                        <Link href={`/vendor/${currentOtherParticipant?.id}`} className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={currentOtherParticipant?.avatar} alt={currentOtherParticipant?.name} />
                                <AvatarFallback>{currentOtherParticipant?.name?.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold">{currentOtherParticipant?.name}</p>
                                    {currentOtherParticipant?.verification === 'verified' && <ShieldCheck className="h-4 w-4 text-green-600" />}
                                    {currentOtherParticipant?.verification === 'trusted' && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                                </div>
                                <p className="text-sm text-muted-foreground">Online</p>
                            </div>
                        </Link>
                    ) : (
                        <>
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
                                <p className="text-sm text-muted-foreground">
                                    Online
                                    {!isAdmin && youBlockedOther && <span className="ml-2 text-xs">• You blocked this user</span>}
                                    {!isAdmin && blockedByOther && <span className="ml-2 text-xs">• You are blocked</span>}
                                </p>
                            </div>
                        </>
                    )}
                    {!isAdmin && selectedChat && (
                        <div className="ml-auto flex items-center gap-2">
                          <MeetingRequestDialog chat={selectedChat}>
                            <Button size="sm" variant="outline">
                              <Calendar className="h-4 w-4 mr-2" /> Schedule Meeting
                            </Button>
                          </MeetingRequestDialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="More actions">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!userId || !currentOtherParticipant?.id) return;
                                  setIsBlocking(true);
                                  try {
                                    if (youBlockedOther) {
                                      await unblockUser(userId, currentOtherParticipant.id);
                                      toast({ title: 'Unblocked', description: 'They can send you messages again.' });
                                    } else {
                                      await blockUser(userId, currentOtherParticipant.id);
                                      toast({ title: 'Blocked', description: 'They cannot send you messages anymore.' });
                                    }
                                  } catch (e) {
                                    toast({ title: 'Error', description: 'Failed to update block status.', variant: 'destructive' });
                                  } finally {
                                    setIsBlocking(false);
                                  }
                                }}
                              >
                                {youBlockedOther ? (<><Unlock className="mr-2 h-4 w-4" /> Unblock</>) : (<><Ban className="mr-2 h-4 w-4" /> Block</>)}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setReportOpen(true)}>
                                <Flag className="mr-2 h-4 w-4" /> Report user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    )}
                </div>
                <div className="flex-grow overflow-y-auto overflow-x-clip min-w-0 w-full max-w-[100vw] flex flex-col" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4 pb-40 sm:pb-4 p-3 sm:p-4 w-full max-w-full">
                    {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} isOwnMessage={message.senderId === userId} chat={selectedChat} role={role} />
                    ))}
                    </div>
                </div>
                <div className="fixed bottom-16 left-0 right-0 z-50 bg-background border-t p-3 sm:static sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto sm:bg-background sm:border-t sm:p-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                    {isAdmin ? (
                         <div className="text-center text-sm text-muted-foreground">Admin view is read-only</div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                {role === 'vendor' ? (
                                    <Link href="/vendor/templates">
                                        <Button variant="outline" size="sm">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Manage Templates
                                        </Button>
                                        </Link>
                                ) : <div />}
                                <div className="flex items-center gap-2">
                                    {role === 'vendor' && (
                                        <QuestionTemplateSelector 
                                            chatId={selectedChat.id}
                                            clientId={getOtherParticipant(selectedChat)?.id}
                                            onTemplateSent={() => {
                                                // Messages update via real-time listener
                                            }}
                                        />
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setMentionOpen(true)}>
                                        Mention Portfolio
                                    </Button>
                                </div>
                            </div>
                            <form onSubmit={handleSendMessage} className="relative">
                                <Input 
                                    placeholder={blockedByOther ? 'You are blocked and cannot send messages.' : 'Type a message...'} 
                                    className="pr-12"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={blockedByOther || isBlocking}
                                />
                                <Button type="submit" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" disabled={blockedByOther || isBlocking}>
                                    <SendHorizonal className="h-4 w-4" />
                                </Button>
                            </form>
                            {selectedChat && (
                                <PortfolioMentionDialog 
                                    chat={selectedChat}
                                    sender={selectedChat.participants.find(p => p.id === (userId || '')) || null}
                                    other={getOtherParticipant(selectedChat) as any}
                                    userId={userId || ''}
                                    open={mentionOpen}
                                    onOpenChange={setMentionOpen}
                                />
                            )}
                        </div>
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

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report user</DialogTitle>
            <DialogDescription>Share details (optional) about your report.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add a brief comment (optional)"
            value={reportComment}
            onChange={(e) => setReportComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!userId || !selectedChat || !currentOtherParticipant?.id) return;
                setIsReporting(true);
                try {
                  await reportUser(userId, currentOtherParticipant.id, selectedChat.id, reportComment);
                  setReportComment('');
                  setReportOpen(false);
                  toast({ title: 'Report submitted', description: 'Thanks for your feedback.' });
                } catch (e) {
                  toast({ title: 'Error', description: 'Failed to submit report.', variant: 'destructive' });
                } finally {
                  setIsReporting(false);
                }
              }}
              disabled={isReporting}
            >
              {isReporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
