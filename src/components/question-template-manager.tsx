'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Copy, Eye, EyeOff, FileQuestion, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { QuestionTemplate, TemplateQuestion, QuestionType, QuestionOption } from '@/lib/types';
import { getQuestionTemplates, createQuestionTemplate, updateQuestionTemplate, deleteQuestionTemplate } from '@/lib/services';

interface QuestionTemplateManagerProps {
  onSelectTemplate?: (template: QuestionTemplate) => void;
  showSelectButton?: boolean;
}

export function QuestionTemplateManager({ onSelectTemplate, showSelectButton = false }: QuestionTemplateManagerProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);

  useEffect(() => {
    if (userId) {
      loadTemplates();
    }
  }, [userId]);

  const loadTemplates = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const userTemplates = await getQuestionTemplates(userId);
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditTemplate = (template: QuestionTemplate) => {
    setEditingTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteQuestionTemplate(templateId);
      await loadTemplates();
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (template: QuestionTemplate) => {
    try {
      await updateQuestionTemplate(template.id, { isActive: !template.isActive });
      await loadTemplates();
      toast({
        title: 'Success',
        description: `Template ${template.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTemplate = async (template: QuestionTemplate) => {
    try {
      const duplicatedTemplate = {
        title: `${template.title} (Copy)`,
        description: template.description,
        questions: template.questions,
        isActive: false,
        vendorId: userId!, // Add vendorId to duplicated template
      };
      await createQuestionTemplate(duplicatedTemplate);
      await loadTemplates();
      toast({
        title: 'Success',
        description: 'Template duplicated successfully',
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Templates</h2>
          <p className="text-muted-foreground">Create and manage templates to gather client requirements</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first question template to start gathering structured information from clients
            </p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {showSelectButton && (
                      <Button
                        size="sm"
                        onClick={() => onSelectTemplate?.(template)}
                        disabled={!template.isActive}
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(template)}
                    >
                      {template.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground">
                      Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {template.questions.slice(0, 3).map((question, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {question.question.length > 30 
                          ? `${question.question.substring(0, 30)}...` 
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

      <TemplateEditorDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={loadTemplates}
      />
    </div>
  );
}

interface TemplateEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template?: QuestionTemplate | null;
  onSave: () => void;
}

function TemplateEditorDialog({ isOpen, onClose, template, onSave }: TemplateEditorDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setQuestions([...template.questions]);
      setIsActive(template.isActive);
    } else {
      setTitle('');
      setDescription('');
      setQuestions([]);
      setIsActive(true);
    }
  }, [template]);

  const addQuestion = () => {
    const newQuestion: TemplateQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      type: 'text',
      required: false,
      placeholder: '',
      helpText: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<TemplateQuestion>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (!question.options) question.options = [];
    question.options.push({
      id: `opt_${Date.now()}`,
      label: '',
      value: '',
    });
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      question.options[optionIndex] = { ...question.options[optionIndex], ...updates };
    }
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      question.options = question.options.filter((_, i) => i !== optionIndex);
    }
    setQuestions(updatedQuestions);
  };

  const handleSave = async () => {
    if (!userId || !title.trim() || questions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a title and at least one question',
        variant: 'destructive',
      });
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question.trim()) {
        toast({
          title: 'Validation Error',
          description: 'All questions must have text',
          variant: 'destructive',
        });
        return;
      }
      if ((question.type === 'select' || question.type === 'multiselect') && (!question.options || question.options.length === 0)) {
        toast({
          title: 'Validation Error',
          description: 'Select questions must have at least one option',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      const templateData = {
        title: title.trim(),
        description: description.trim(),
        questions,
        isActive,
        vendorId: userId, // Add vendorId to template data
      };

      if (template) {
        await updateQuestionTemplate(template.id, templateData);
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      } else {
        await createQuestionTemplate(templateData);
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Template Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Wedding Planning Requirements"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this template is for..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Active (available for use)</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, questionIndex) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label>Question Text</Label>
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, { question: e.target.value })}
                            placeholder="Enter your question..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Question Type</Label>
                            <Select
                              value={question.type}
                              onValueChange={(value: QuestionType) => updateQuestion(questionIndex, { type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Single Select</SelectItem>
                                <SelectItem value="multiselect">Multi Select</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="boolean">Yes/No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 pt-6">
                            <Switch
                              checked={question.required}
                              onCheckedChange={(checked) => updateQuestion(questionIndex, { required: checked })}
                            />
                            <Label>Required</Label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Placeholder</Label>
                            <Input
                              value={question.placeholder || ''}
                              onChange={(e) => updateQuestion(questionIndex, { placeholder: e.target.value })}
                              placeholder="Placeholder text..."
                            />
                          </div>
                          <div>
                            <Label>Help Text</Label>
                            <Input
                              value={question.helpText || ''}
                              onChange={(e) => updateQuestion(questionIndex, { helpText: e.target.value })}
                              placeholder="Additional help text..."
                            />
                          </div>
                        </div>

                        {(question.type === 'select' || question.type === 'multiselect') && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Options</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addOption(questionIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                              </Button>
                            </div>
                            {question.options?.map((option, optionIndex) => (
                              <div key={option.id} className="flex gap-2">
                                <Input
                                  value={option.label}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, { 
                                    label: e.target.value, 
                                    value: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                                  })}
                                  placeholder="Option label"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeOption(questionIndex, optionIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                        className="ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions added yet. Click "Add Question" to get started.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}