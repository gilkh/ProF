
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ServiceOrOffer, ForwardedItem, QuoteRequest, LineItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatItemForMessage(item: ServiceOrOffer, message: string, isQuote = false, quoteDetails: Partial<QuoteRequest> = {}): string {
  const forwardedItem: ForwardedItem = {
    isForwarded: true,
    isQuoteRequest: isQuote,
    isQuoteResponse: false,
    title: item.title,
    image: item.image,
    vendorName: item.vendorName,
    price: item.type === 'offer' ? item.price : undefined,
    userMessage: message,
    itemId: item.id,
    itemType: item.type,
    eventDate: quoteDetails.eventDate,
    guestCount: quoteDetails.guestCount,
    phone: quoteDetails.phone,
  };
  return JSON.stringify(forwardedItem);
}


export function formatQuoteResponseMessage(quoteRequestId: string, vendorName: string, serviceTitle: string, lineItems: LineItem[], total: number, message: string): string {
    const forwardedItem: ForwardedItem = {
        isForwarded: true,
        isQuoteRequest: false,
        isQuoteResponse: true,
        quoteRequestId: quoteRequestId,
        vendorName: vendorName,
        title: `Quote for: ${serviceTitle}`,
        lineItems: lineItems,
        total: total,
        userMessage: message,
    };
    return JSON.stringify(forwardedItem);
}


export function parseForwardedMessage(text: string): ForwardedItem | null {
  try {
    const data = JSON.parse(text);
    if (data && data.isForwarded === true) {
      return data as ForwardedItem;
    }
    return null;
  } catch (e) {
    return null;
  }
}
