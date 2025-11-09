"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Chat, ChatParticipant } from "@/lib/types";
import { formatPortfolioMentionMessage } from "@/lib/utils";
import { sendMessage, getVendorProfile } from "@/lib/services";
import Image from "next/image";

export function PortfolioMentionDialog({
  chat,
  sender,
  other,
  userId,
  open,
  onOpenChange,
}: {
  chat: Chat;
  sender: ChatParticipant | null;
  other: ChatParticipant | null;
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [portfolio, setPortfolio] = useState<Array<{ url: string; type: 'image' | 'video'; category?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Compute vendor context: vendors select from their own portfolio,
  // clients select from the portfolio of the vendor they are chatting with.
  const vendorId = useMemo(() => {
    const s: any = sender || {};
    const o: any = other || {};
    if (s.role === 'vendor') return s.id;
    if (o.role === 'vendor') return o.id;
    return o.id || '';
  }, [sender, other]);

  const vendorName = useMemo(() => {
    const s: any = sender || {};
    const o: any = other || {};
    if (s.role === 'vendor') return s.name || 'Vendor';
    return o.name || 'Vendor';
  }, [sender, other]);

  useEffect(() => {
    let cancelled = false;
    async function loadPortfolio() {
      if (!open || !vendorId) return;
      setLoading(true);
      try {
        const vp = await getVendorProfile(vendorId);
        const items = (vp?.portfolio || []).filter((m: any) => m && (m.status === 'approved'))
          .map((m: any) => ({ url: m.url, type: m.type, category: m.category }));
        if (!cancelled) {
          setPortfolio(items);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPortfolio();
    return () => { cancelled = true; };
  }, [open, vendorId]);

  const handleSelectAndSend = async (idx: number) => {
    if (portfolio.length === 0 || idx < 0 || idx >= portfolio.length) return;
    const media = portfolio[idx];
    setIsSending(true);
    try {
      const payload = formatPortfolioMentionMessage({
        vendorId,
        vendorName,
        media: { url: media.url, type: media.type, category: media.category },
        caption: undefined,
      });
      await sendMessage(chat.id, userId, payload);
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mention Portfolio Media</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Select from {vendorName}'s portfolio</p>
            {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
          </div>
          {portfolio.length === 0 && !loading ? (
            <div className="text-sm text-muted-foreground">No approved portfolio media found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {portfolio.map((m, idx) => (
                <button
                  key={m.url + idx}
                  type="button"
                  onClick={() => !isSending && handleSelectAndSend(idx)}
                  disabled={isSending}
                  className="relative aspect-square rounded-md overflow-hidden border border-primary/10 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  title={m.category || undefined}
                >
                  {m.type === 'image' ? (
                    <Image src={m.url} alt={m.category || 'Portfolio media'} fill className="object-cover" />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                  )}
                  {m.category && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{m.category}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}