"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PortfolioMentionMessage } from "@/lib/types";
import { format } from "date-fns";

export function PortfolioMentionBubble({ data, timestamp, isOwnMessage }: { data: PortfolioMentionMessage; timestamp?: Date; isOwnMessage: boolean }) {
  const categorySlug = (data.media.category || "uncategorized").toLowerCase().replace(/\s+/g, "-");
  const profileHref = `/vendor/${data.vendorId}#gallery-${categorySlug}`;

  return (
    <div className="bg-background border-2 border-primary/30 rounded-lg p-3 w-full max-w-[70.3125%] shadow-md">
      <Link href={profileHref} className="block">
        <div className="relative aspect-square rounded-md overflow-hidden mb-2">
          {data.media.type === "image" ? (
            <Image src={data.media.url} alt={data.caption || `${data.vendorName} portfolio`} fill className="object-cover" />
          ) : (
            <video src={data.media.url} className="w-full h-full object-cover" controls />
          )}
        </div>
        <h4 className="font-bold text-sm">{data.vendorName}</h4>
        <p className="text-xs text-muted-foreground">{data.media.category || "Uncategorized"}</p>
      </Link>
      {data.caption && (
        <div className="mt-2 bg-muted rounded-md p-2 border border-primary/20">
          <p className="text-sm text-foreground">{data.caption}</p>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <Link href={profileHref} className="flex-1">
          <Button variant="outline" className="w-full">View Profile</Button>
        </Link>
        <a href={data.media.url} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button className="w-full">Open Media</Button>
        </a>
      </div>
      {timestamp && (
        <div className="mt-2 text-xs text-muted-foreground text-right">{format(new Date(timestamp), "p")}</div>
      )}
    </div>
  );
}