
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVendorQuoteRequests, respondToQuote } from '@/lib/services';
import type { QuoteRequest } from '@/lib/types';
import { Check, Edit, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function RespondToQuoteDialog({ request, onQuoteSent }: { request: QuoteRequest, onQuoteSent: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);

    const formData = new FormData(event.currentTarget);
    const price = parseFloat(formData.get('price') as string);
    const responseMessage = formData.get('response') as string;

    try {
      await respondToQuote(request.id, request.vendorId, request.clientId, price, responseMessage);
      toast({
        title: 'Quote Sent!',
        description: 'Your response has been sent to the client and added to your chat history.',
      });
      onQuoteSent();
      setOpen(false);
    } catch (error) {
      console.error('Failed to send quote response:', error);
      toast({ title: 'Error', description: 'Could not send the quote response.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Respond
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to Quote Request</DialogTitle>
          <DialogDescription>
            Create a quote for {request.clientName} regarding "{request.serviceTitle}".
          </DialogDescription>
        </DialogHeader>
        <form id={`respond-form-${request.id}`} onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="price">Your Quoted Price ($)</Label>
            <Input id="price" name="price" type="number" step="0.01" required />
          </div>
          <div>
            <Label htmlFor="response">Your Message</Label>
            <Textarea id="response" name="response" rows={4} placeholder="Here are the details of the quote..." required />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form={`respond-form-${request.id}`} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientRequestsPage() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [requests, setRequests] = useState<QuoteRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        if (!userId) {
            if (!isAuthLoading) setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const quoteRequests = await getVendorQuoteRequests(userId);
            setRequests(quoteRequests);
        } catch (error) {
            console.error("Failed to load quote requests:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, isAuthLoading]);

    const pageIsLoading = isLoading || isAuthLoading;

  return (
     <Card>
        <CardHeader>
            <CardTitle>Incoming Quote Requests</CardTitle>
            <CardDescription>Review and respond to new client inquiries.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pageIsLoading ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : requests.map((request) => (
                <TableRow key={request.id}>
                    <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={request.clientAvatar} alt={request.clientName} />
                        <AvatarFallback>{request.clientName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p>{request.clientName}</p>
                            <p className="text-xs text-muted-foreground">{request.phone}</p>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>{request.serviceTitle}</TableCell>
                    <TableCell className="max-w-sm truncate">{request.message}</TableCell>
                    <TableCell>
                    <Badge
                        variant={
                        request.status === 'pending'
                            ? 'secondary'
                            : request.status === 'responded'
                            ? 'default'
                            : 'destructive'
                        }
                        className={request.status === 'responded' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                        {request.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    {request.status === 'pending' ? (
                       <RespondToQuoteDialog request={request} onQuoteSent={fetchRequests} />
                    ) : (
                        <Button size="sm" variant="outline" disabled>
                           <Check className="mr-2 h-4 w-4" />
                           Responded
                        </Button>
                    )}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
