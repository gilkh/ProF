'use client';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Calendar, Phone, MapPin, Clock, ArrowRightLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { respondToMeetingProposal } from '@/lib/services';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { ChatMessage, MeetingProposal, MeetingProposalStatus } from '@/lib/types';
import { parseMeetingProposalMessage, parseMeetingStatusMessage } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { MeetingRequestDialog } from './meeting-request-dialog';

export function MeetingProposalBubble({ message, isOwnMessage }: { message: ChatMessage; isOwnMessage: boolean }) {
  const { toast } = useToast();
  const { userId } = useAuth();
  const proposal = parseMeetingProposalMessage(message.text);
  const [declineReason, setDeclineReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbProposal, setDbProposal] = useState<MeetingProposal | null>(null);

  if (!proposal) return null;

  const formattedDate = format(parseISO(proposal.dateTime), 'PPP p');

  // Fetch latest proposal doc to know if it's already responded or no longer pending
  React.useEffect(() => {
    let mounted = true;
    async function fetchProposal() {
      try {
        if (!proposal?.proposalId) return;
        const snap = await getDoc(doc(db, 'meetingProposals', proposal.proposalId));
        if (snap.exists() && mounted) {
          const data = snap.data() as MeetingProposal;
          setDbProposal({ ...data, id: snap.id });
        }
      } catch (e) {
        console.error('Failed to load proposal doc for actions state:', e);
      }
    }
    fetchProposal();
    return () => { mounted = false; };
  }, [proposal?.proposalId]);

  async function refreshProposal() {
    try {
      if (!proposal?.proposalId) return;
      const snap = await getDoc(doc(db, 'meetingProposals', proposal.proposalId));
      if (snap.exists()) {
        const data = snap.data() as MeetingProposal;
        setDbProposal({ ...data, id: snap.id });
      }
    } catch (e) {
      console.error('Failed to refresh proposal doc:', e);
    }
  }

  const handleRespond = async (status: MeetingProposalStatus) => {
    if (!proposal?.proposalId) return;
    setIsSubmitting(true);
    try {
      if (!userId) throw new Error('Not logged in');
      await respondToMeetingProposal(proposal.proposalId, userId, status, declineReason || undefined);
      toast({ title: status === 'accepted' ? 'Meeting Accepted' : 'Meeting Declined', description: 'Your response was posted to the chat.' });
      setShowDecline(false);
      setDeclineReason('');
      // Refresh doc to reflect respondedBy/status, which disables actions
      await refreshProposal();
    } catch (error) {
      console.error('Failed to respond to proposal:', error);
      toast({ title: 'Error', description: 'Could not submit response.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border-2 border-primary/30 rounded-lg p-4 w-full max-w-[70.3125%] shadow-lg">
      <div className="flex items-center gap-3 mb-3 border-b pb-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Meeting Proposal</h3>
          <p className="text-sm text-muted-foreground">Round {proposal.round || 1}</p>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          {proposal.type === 'call' ? <Phone className="h-4 w-4 text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
          <p><span className="text-muted-foreground">Type:</span> {proposal.type === 'call' ? 'Call' : 'In-person'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p><span className="text-muted-foreground">When:</span> {formattedDate}</p>
        </div>
        {proposal.agenda && (
          <div className="bg-muted rounded-md p-2 border border-primary/10">
            <p className="text-muted-foreground font-medium">Agenda</p>
            <p>{proposal.agenda}</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {(() => {
          const effectiveStatus = dbProposal?.status ?? proposal.status;
          const anyResponded = !!dbProposal?.respondedBy;
          const label = effectiveStatus !== 'pending'
            ? (effectiveStatus === 'accepted' ? 'Accepted' : 'Declined')
            : (anyResponded ? 'Responded' : 'Pending');
          const variant: Parameters<typeof Badge>[0]['variant'] =
            effectiveStatus === 'declined' ? 'destructive'
            : effectiveStatus === 'accepted' ? 'default'
            : anyResponded ? 'default'
            : 'secondary';
          return (
            <Badge variant={variant}>{label}</Badge>
          );
        })()}
      </div>
      {(() => {
        const hasResponded = dbProposal?.respondedBy === userId;
        const notPending = dbProposal?.status && dbProposal.status !== 'pending';
        const canAct = !isOwnMessage && proposal.status === 'pending' && !hasResponded && !notPending;
        const disableButtons = isSubmitting || hasResponded || notPending;
        if (!canAct) return null;
        return (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Button onClick={() => handleRespond('accepted')} disabled={disableButtons} className="flex-1">
              <Check className="h-4 w-4 mr-2" /> Accept
            </Button>
            <Button variant="outline" onClick={() => setShowDecline(v => !v)} disabled={disableButtons} className="flex-1">
              <X className="h-4 w-4 mr-2" /> Decline
            </Button>
            <MeetingRequestDialog proposalToCounter={proposal} onSubmitted={refreshProposal}>
              <Button variant="secondary" className="flex-1">
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Counter
              </Button>
            </MeetingRequestDialog>
          </div>
          {showDecline && (
            <div className="space-y-2">
              <Textarea placeholder="Optional reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3} />
              <Button variant="destructive" onClick={() => handleRespond('declined')} disabled={disableButtons}>Submit Decline</Button>
            </div>
          )}
        </div>
        );
      })()}
      <Separator className="mt-4" />
      <div className="mt-2 text-xs text-muted-foreground text-right">{format(new Date(message.timestamp), 'p')}</div>
    </div>
  );
}

export function MeetingStatusBubble({ message }: { message: ChatMessage }) {
  const { userId } = useAuth();
  const status = parseMeetingStatusMessage(message.text);
  if (!status) return null;
  const isOwn = userId === message.senderId;

  const [proposal, setProposal] = useState<MeetingProposal | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function fetchProposal() {
      try {
        if (!status?.proposalId) return;
        const snap = await getDoc(doc(db, 'meetingProposals', status.proposalId));
        if (snap.exists() && mounted) {
          const data = snap.data() as MeetingProposal;
          setProposal({ ...data, id: snap.id });
        }
      } catch (e) {
        console.error('Failed to load meeting proposal for status bubble:', e);
      }
    }
    fetchProposal();
    return () => { mounted = false; };
  }, [status?.proposalId]);

  const icon = status.status === 'accepted' ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />;
  const formattedDate = proposal?.dateTime ? format(parseISO(proposal.dateTime), 'PPP p') : null;

  return (
    <div className="bg-background border-2 border-primary/20 rounded-lg p-3 w-full max-w-[70.3125%] shadow-md">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm">
          {status.status === 'declined'
            ? (isOwn ? 'You declined this meeting' : 'The other person is kindly declining this meeting')
            : 'Meeting accepted'}
          {status.reason ? ` — ${status.reason}` : ''}
        </p>
      </div>
      {status.status === 'accepted' && proposal && (
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {proposal.type === 'call' ? <Phone className="h-4 w-4 text-muted-foreground" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
            <span>{proposal.type === 'call' ? 'Call' : 'In-person'}</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
          )}
          {proposal.agenda && (
            <div className="bg-muted rounded-md p-2 border border-primary/10">
              <p className="text-muted-foreground font-medium">Agenda</p>
              <p>{proposal.agenda}</p>
            </div>
          )}
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground text-right">{format(new Date(message.timestamp), 'p')}</div>
    </div>
  );
}