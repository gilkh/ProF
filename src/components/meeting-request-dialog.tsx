'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Chat, MeetingType, MeetingProposalMessage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { createMeetingProposal, counterProposeMeeting } from '@/lib/services';

interface MeetingRequestDialogProps {
  children: React.ReactNode;
  chat?: Chat;
  proposalToCounter?: MeetingProposalMessage;
  onSubmitted?: () => void;
}

export function MeetingRequestDialog({ children, chat, proposalToCounter, onSubmitted }: MeetingRequestDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [meetingType, setMeetingType] = React.useState<MeetingType>(proposalToCounter?.type || 'in_person');
  const [dateTime, setDateTime] = React.useState<string>('');
  const [agenda, setAgenda] = React.useState<string>(proposalToCounter?.agenda || '');

  const otherParticipantId = React.useMemo(() => {
    // For new proposals, determine the recipient from chat participants
    const participant = chat?.participants.find(p => p.id !== userId);
    return participant?.id;
  }, [chat?.participants, userId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Validate date/time
    if (!dateTime) {
      toast({ title: 'Missing Date/Time', description: 'Please select a date and time.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (proposalToCounter) {
        // Counter-proposal path: only requires current user and proposalId
        if (!userId || !proposalToCounter.proposalId) {
          toast({ title: 'Not Ready', description: 'Missing user or proposal context.', variant: 'destructive' });
          return;
        }
        await counterProposeMeeting(proposalToCounter.proposalId, userId, { type: meetingType, dateTime, agenda });
        toast({ title: 'Counter-Proposal Sent', description: 'Your alternative time was shared in the chat.' });
      } else {
        const chatIdToUse = chat?.id;
        if (!userId || !chatIdToUse || !otherParticipantId) {
          toast({ title: 'Not Ready', description: 'Missing chat or user context.', variant: 'destructive' });
          return;
        }
        await createMeetingProposal({
          chatId: chatIdToUse,
          proposerId: userId,
          recipientId: otherParticipantId,
          type: meetingType,
          dateTime,
          agenda: agenda || undefined,
        });
        toast({ title: 'Meeting Proposal Sent', description: 'Your meeting request was shared in the chat.' });
      }
      // Notify parent/UI that a submission occurred (used to disable actions)
      onSubmitted?.();
      setOpen(false);
      setDateTime('');
      setAgenda('');
    } catch (error) {
      console.error('Failed to submit meeting proposal:', error);
      toast({ title: 'Error', description: 'Could not submit your proposal.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={handleTriggerClick}>{children}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{proposalToCounter ? 'Counter-Propose Meeting' : 'Schedule a Meeting'}</DialogTitle>
          <DialogDescription>
            {proposalToCounter ? 'Suggest a new time/date for this meeting.' : 'Pick a type, date/time, and optional agenda.'}
          </DialogDescription>
        </DialogHeader>
        <form id="meeting-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <div className="col-span-3">
              <RadioGroup value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_person" id="in_person" />
                  <Label htmlFor="in_person">In-person</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="call" id="call" />
                  <Label htmlFor="call">Call</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateTime" className="text-right">Date & Time</Label>
            <Input id="dateTime" name="dateTime" type="datetime-local" className="col-span-3" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agenda" className="text-right">Agenda</Label>
            <Textarea id="agenda" name="agenda" placeholder="Optional details or agenda" className="col-span-3" value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={4} />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="meeting-form" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Sending...' : (proposalToCounter ? 'Send Counter-Proposal' : 'Send Proposal')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}