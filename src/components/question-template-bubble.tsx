'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileQuestion, Clock, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { QuestionTemplateMessage, TemplateResponse } from '@/lib/types';
import { QuestionResponseForm } from './question-response-form';

interface QuestionTemplateBubbleProps {
  templateMessage: QuestionTemplateMessage;
  chatId: string;
  isOwnMessage: boolean;
  timestamp?: Date;
  onResponseSubmitted?: () => void;
}

export function QuestionTemplateBubble({ 
  templateMessage, 
  chatId, 
  isOwnMessage, 
  timestamp,
  onResponseSubmitted 
}: QuestionTemplateBubbleProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);

  const handleResponseSubmitted = () => {
    setShowResponseForm(false);
    onResponseSubmitted?.();
  };

  return (
    <Card className={cn(
      "max-w-md w-full shadow-lg",
      isOwnMessage ? "border-primary/30" : "border-muted"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600/10 text-blue-700">
              <FileQuestion className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Question Template</CardTitle>
              <p className="text-xs text-muted-foreground">From {templateMessage.vendorName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {templateMessage.questions.length} question{templateMessage.questions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm mb-1">{templateMessage.templateTitle}</h3>
          <p className="text-xs text-muted-foreground">
            Please answer the questions below to help us provide you with an accurate quote.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Questions from {templateMessage.vendorName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Estimated time: {Math.ceil(templateMessage.questions.length * 0.5)} minutes</span>
          </div>
        </div>

        {!isOwnMessage && (
          <Dialog open={showResponseForm} onOpenChange={setShowResponseForm}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm">
                <FileQuestion className="h-4 w-4 mr-2" />
                Answer Questions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Answer Questions</DialogTitle>
              </DialogHeader>
              <QuestionResponseForm
                templateMessage={templateMessage}
                chatId={chatId}
                onSubmit={handleResponseSubmitted}
              />
            </DialogContent>
          </Dialog>
        )}

        {timestamp && (
          <div className="text-xs text-muted-foreground text-right pt-2 border-t">
            {format(new Date(timestamp), 'p')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TemplateResponseBubbleProps {
  responseData: {
    type: 'template_response';
    responseId: string;
    templateTitle: string;
    clientName: string;
    responseCount: number;
    submittedAt: Date;
    questions?: TemplateQuestion[];
    responses?: QuestionResponse[];
  };
  isOwnMessage: boolean;
  timestamp?: Date;
}

export function TemplateResponseBubble({ 
  responseData, 
  isOwnMessage, 
  timestamp 
}: TemplateResponseBubbleProps) {
  const { templateTitle, clientName, responseCount, submittedAt, questions, responses } = responseData;

  return (
    <Card className={cn(
      "max-w-md w-full shadow-lg border-green-200 bg-green-50",
      isOwnMessage && "border-primary/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600/10 text-green-700">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Response Submitted</CardTitle>
              <p className="text-xs text-muted-foreground">From {clientName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
            {responseCount} answer{responseCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm mb-1">{templateTitle}</h3>
          <p className="text-xs text-muted-foreground">
            ✅ All questions have been answered and submitted successfully.
          </p>
        </div>

        {questions && responses && (
          <div className="space-y-3">
            {questions.map((question, index) => {
              const response = responses.find(r => r.questionId === question.id);
              return (
                <div key={question.id} className="bg-white rounded-md p-3 border border-gray-100">
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {question.question}
                  </p>
                  <p className="text-sm text-gray-600">
                    {response?.answer || 'No answer provided'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Submitted {format(new Date(submittedAt), 'PPp')}</span>
        </div>

        {timestamp && (
          <div className="text-xs text-muted-foreground text-right pt-2 border-t">
            {format(new Date(timestamp), 'p')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}