
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ServiceOrOffer, ForwardedItem, QuoteRequest, LineItem, QuestionTemplateMessage } from "./types";

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

export function formatQuestionTemplateMessage(templateMessage: QuestionTemplateMessage): string {
  return JSON.stringify({
    ...templateMessage,
    isQuestionTemplate: true
  });
}

export function parseQuestionTemplateMessage(text: string): QuestionTemplateMessage | null {
  try {
    const data = JSON.parse(text);
    if (data && data.isQuestionTemplate === true) {
      return data as QuestionTemplateMessage;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function formatTemplateResponseMessage(responseId: string, templateTitle: string, clientName: string, responseCount: number, submittedAt: Date): string {
  return JSON.stringify({
    type: 'template_response',
    responseId,
    templateTitle,
    clientName,
    responseCount,
    submittedAt,
    isTemplateResponse: true
  });
}

export function parseTemplateResponseMessage(text: string): any | null {
  try {
    const data = JSON.parse(text);
    if (data && data.isTemplateResponse === true) {
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
}
