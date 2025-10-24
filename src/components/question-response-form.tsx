'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Send, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { TemplateQuestion, QuestionResponse, QuestionTemplateMessage } from '@/lib/types';
import { submitTemplateResponse } from '@/lib/services';

interface QuestionResponseFormProps {
  templateMessage: QuestionTemplateMessage;
  chatId: string;
  onSubmit: () => void;
}

export function QuestionResponseForm({ templateMessage, chatId, onSubmit }: QuestionResponseFormProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    templateMessage.questions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];
        if (response === undefined || response === null || response === '' || 
            (Array.isArray(response) && response.length === 0)) {
          newErrors[question.id] = 'This field is required';
        }
      }
      
      // Type-specific validation
      if (responses[question.id] !== undefined && responses[question.id] !== '') {
        if (question.type === 'number') {
          const num = Number(responses[question.id]);
          if (isNaN(num)) {
            newErrors[question.id] = 'Please enter a valid number';
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!userId) return;
    
    if (!validateResponses()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const questionResponses: QuestionResponse[] = templateMessage.questions.map(question => ({
        questionId: question.id,
        answer: responses[question.id] || (question.type === 'multiselect' ? [] : ''),
      }));

      await submitTemplateResponse({
        templateId: templateMessage.templateId,
        chatId,
        clientId: userId,
        vendorId: templateMessage.vendorId,
        responses: questionResponses,
      });

      toast({
        title: 'Success',
        description: 'Your responses have been submitted successfully',
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit responses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: TemplateQuestion) => {
    const hasError = !!errors[question.id];
    
    const baseProps = {
      id: question.id,
      className: cn(hasError && 'border-destructive'),
    };

    switch (question.type) {
      case 'text':
        return (
          <Textarea
            {...baseProps}
            value={responses[question.id] || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            value={responses[question.id] || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );

      case 'select':
        return (
          <Select
            value={responses[question.id] || ''}
            onValueChange={(value) => updateResponse(question.id, value)}
          >
            <SelectTrigger className={cn(hasError && 'border-destructive')}>
              <SelectValue placeholder={question.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}_${option.id}`}
                  checked={(responses[question.id] || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || [];
                    if (checked) {
                      updateResponse(question.id, [...currentValues, option.value]);
                    } else {
                      updateResponse(question.id, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}_${option.id}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
            {hasError && (
              <p className="text-sm text-destructive mt-1">
                {errors[question.id]}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <RadioGroup
            value={responses[question.id]?.toString() || ''}
            onValueChange={(value) => updateResponse(question.id, value === 'true')}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}_yes`} />
              <Label htmlFor={`${question.id}_yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}_no`} />
              <Label htmlFor={`${question.id}_no`}>No</Label>
            </div>
          </RadioGroup>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !responses[question.id] && 'text-muted-foreground',
                  hasError && 'border-destructive'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {responses[question.id] ? (
                  format(new Date(responses[question.id]), 'PPP')
                ) : (
                  <span>{question.placeholder || 'Pick a date'}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={responses[question.id] ? new Date(responses[question.id]) : undefined}
                onSelect={(date) => updateResponse(question.id, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return (
          <Input
            {...baseProps}
            value={responses[question.id] || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            placeholder={question.placeholder}
          />
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{templateMessage.templateTitle}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              From {templateMessage.vendorName}
            </p>
          </div>
          <Badge variant="secondary">
            {templateMessage.questions.length} question{templateMessage.questions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {templateMessage.questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <Label htmlFor={question.id} className="text-sm font-medium">
                {index + 1}. {question.question}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            
            {question.helpText && (
              <p className="text-xs text-muted-foreground">{question.helpText}</p>
            )}
            
            {renderQuestion(question)}
            
            {errors[question.id] && question.type !== 'multiselect' && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors[question.id]}
              </div>
            )}
          </div>
        ))}
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Responses
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}