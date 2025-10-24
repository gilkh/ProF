'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { FileQuestion, Search, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { QuestionTemplate } from '@/lib/types';
import { getQuestionTemplates, sendQuestionTemplate } from '@/lib/services';

interface QuestionTemplateSelectorProps {
  chatId: string;
  clientId?: string; // Add optional clientId prop
  onTemplateSent?: () => void;
  trigger?: React.ReactNode;
}

export function QuestionTemplateSelector({ chatId, clientId, onTemplateSent, trigger }: QuestionTemplateSelectorProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<QuestionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userId && isOpen) {
      loadTemplates();
    }
  }, [userId, isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = templates.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.questions.some(q => q.question.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchQuery, templates]);

  const loadTemplates = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const userTemplates = await getQuestionTemplates(userId);
      setTemplates(userTemplates.filter(template => template.isActive));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: QuestionTemplate) => {
    handleSendTemplate(template);
  };

  const handleSendTemplate = async (template: QuestionTemplate) => {
    if (!userId || !chatId) return;
    
    // If clientId is not provided, try to extract it from chatId
    // Chat IDs are typically formatted as "clientId_vendorId" or "vendorId_clientId"
    let targetClientId = clientId;
    if (!targetClientId) {
      const chatParticipants = chatId.split('_');
      // Find the participant that's not the current user (vendor)
      targetClientId = chatParticipants.find(id => id !== userId);
    }
    
    if (!targetClientId) {
      toast({
        title: "Error",
        description: "Could not identify client to send template to",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    try {
      await sendQuestionTemplate(template.id, chatId, userId, targetClientId);
      setIsOpen(false);
      onTemplateSent?.();
      toast({
        title: "Template sent",
        description: `"${template.title}" has been sent to the client`,
      });
    } catch (error) {
      console.error('Error sending template:', error);
      toast({
        title: "Error",
        description: "Failed to send template",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileQuestion className="h-4 w-4 mr-2" />
      Send Questions
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Question Template</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="max-h-[50vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading templates...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No templates found' : 'No active templates'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create some question templates to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSelectTemplate(template)}
                          className="ml-4"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{template.questions.length} question{template.questions.length !== 1 ? 's' : ''}</span>
                          <span>Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.questions.slice(0, 3).map((question, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {question.question.length > 25 
                                ? `${question.question.substring(0, 25)}...` 
                                : question.question
                              }
                            </Badge>
                          ))}
                          {template.questions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.questions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}