'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState, Suspense, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader, PlusCircle, Trash2, Edit, Save, List, Sparkles, ArrowLeft, DollarSign, Eye, EyeOff, BarChart3, CheckSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { EventTask, SavedTimeline, GenerateEventPlanInput, CostBreakdownItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveTimeline, getSavedTimelines, updateTimeline } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';
import { generateTimeline } from '@/lib/timeline-generator';
import { motion, AnimatePresence } from 'framer-motion';
import { eventTypes, getQuestionsForEventType } from '@/lib/timeline-generator';
import { getEventTheme } from '@/lib/event-themes';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { CelebrationHeader } from '@/components/ui/celebration-header';
import { useIsMobile } from '@/hooks/use-mobile';
import '../../mobile-s-curve.css';
import '../../border-fix.css';

const formSchema = z.object({
  eventType: z.string().min(1, 'Please select a valid event type'),
  eventDate: z.string().min(1, 'Event date is required'),
  guestCount: z.coerce.number().min(1, 'Guest count must be at least 1'),
  budget: z.coerce.number().min(1, 'Budget is required'),
});

function EventPlannerContent() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [timeline, setTimeline] = useState<EventTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [eventName, setEventName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskLabel, setEditedTaskLabel] = useState('');
  const [timelineId, setTimelineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [deletedTask, setDeletedTask] = useState<{ task: EventTask; index: number } | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Multi-step form state
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<z.infer<typeof formSchema> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  
  const [eventTypeInput, setEventTypeInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
  const [initialBudget, setInitialBudget] = useState(0);

  // Enhanced features state
  const [showCosts, setShowCosts] = useState(true);
  const [viewMode, setViewMode] = useState<'tasks' | 'breakdown'>('tasks');
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [costType, setCostType] = useState<'estimated' | 'recommended'>('estimated');

  const { toast } = useToast();

  const handleLoadTimeline = (timelineToLoad: SavedTimeline) => {
    setTimeline(timelineToLoad.tasks);
    setEventName(timelineToLoad.name);
    setTimelineId(timelineToLoad.id);
    setInitialBudget(timelineToLoad.initialBudget || 0);
    
    if (timelineToLoad.costBreakdown) {
      setCostBreakdown(timelineToLoad.costBreakdown);
    }
    setStep(3);
  }

  useEffect(() => {
    const timelineIdToLoad = searchParams.get('timelineId');
    if (timelineIdToLoad && userId) {
        const loadTimeline = async () => {
            setIsLoading(true);
            try {
                const timelines = await getSavedTimelines(userId);
                const timelineToLoad = timelines.find(t => t.id === timelineIdToLoad);

                if (timelineToLoad) {
                    handleLoadTimeline(timelineToLoad);
                } else {
                    toast({ title: "❌ Error", description: "Timeline not found.", variant: "destructive" });
                }
                router.replace('/client/event-planner', { scroll: false });
            } catch (error) {
                console.error("Could not load timeline from Firestore", error);
                toast({ title: "❌ Error", description: "Could not load the timeline.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadTimeline();
    }
  }, [searchParams, router, userId, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: '',
      eventDate: '',
      guestCount: 100,
      budget: 5000,
    },
  });

  const handleEventTypeChange = (value: string) => {
    setEventTypeInput(value);
    if (value) {
        const filtered = eventTypes.filter(type => type.toLowerCase().includes(value.toLowerCase()));
        setSuggestions(filtered);
        setIsSuggestionBoxOpen(true);
    } else {
        setSuggestions([]);
        setIsSuggestionBoxOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEventTypeInput(suggestion);
    form.setValue('eventType', suggestion);
    setIsSuggestionBoxOpen(false);
  };

  function onFirstStepSubmit(values: z.infer<typeof formSchema>) {
    setFormValues(values);
    setInitialBudget(values.budget);
    setStep(2);
  }

  function generatePlan() {
    if (!formValues) return;
    setIsLoading(true);
    setTimeline(null);
    setTimelineId(null);
    setEventName(`${formValues.eventType}`);

    try {
      const planInput = {
        ...formValues,
        answers,
      };

      const plan = generateTimeline(planInput as GenerateEventPlanInput);
      
      if (plan?.tasks) {
        setTimeline(plan.tasks);
        if (plan.costBreakdown) {
          setCostBreakdown(plan.costBreakdown);
        }
      } else {
        toast({ title: "❌ Error", description: "Could not generate a plan. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to generate event plan:', error);
       toast({ title: "❌ Error", description: "An error occurred while generating the plan.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setStep(3);
    }
  }

  const handleTaskCheck = (taskId: string) => {
    setTimeline(prev => 
      prev!.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const handleAddTask = (index?: number) => {
    const newTask: EventTask = {
      id: `custom-${Date.now()}`,
      task: '✨ New Task - Click edit to change',
      deadline: new Date().toISOString().split('T')[0],
      estimatedCost: 0,
      completed: false,
    };
    
    startTransition(() => {
      setTimeline(prev => {
        const newTasks = [...(prev || [])];
        if (index !== undefined) {
            newTasks.splice(index, 0, newTask);
        } else {
            newTasks.push(newTask);
        }
        return newTasks;
      });
    })
  };
  
  const handleDeleteTask = (taskId: string) => {
    const taskIndex = timeline?.findIndex(task => task.id === taskId) ?? -1;
    const taskToDelete = timeline?.find(task => task.id === taskId);
    
    if (taskToDelete && taskIndex !== -1) {
      // Store deleted task for undo
      setDeletedTask({ task: taskToDelete, index: taskIndex });
      setShowUndoToast(true);
      
      // Remove task from timeline
      setTimeline(prev => prev!.filter(task => task.id !== taskId));
      
      // Hide undo toast after 10 seconds
      setTimeout(() => {
        setShowUndoToast(false);
        setDeletedTask(null);
      }, 10000);
    }
  };
  
  const handleUndoDelete = () => {
    if (deletedTask && timeline) {
      const newTimeline = [...timeline];
      newTimeline.splice(deletedTask.index, 0, deletedTask.task);
      setTimeline(newTimeline);
      setDeletedTask(null);
      setShowUndoToast(false);
    }
  };
  
  // Helper function to determine if task description needs show more/less
  const shouldShowToggle = (description: string, isMobile: boolean) => {
    if (!description) return false;
    
    // For mobile: shorter threshold due to smaller screen
    // For desktop: longer threshold due to more space
    const threshold = isMobile ? 60 : 120;
    
    return description.length > threshold;
  };
  
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };
  
  const handleEditTask = (task: EventTask) => {
    setEditingTaskId(task.id);
    setEditedTaskLabel(task.task);
  };
  
  const handleSaveTask = (taskId: string) => {
    setTimeline(prev => 
      prev!.map(task => 
        task.id === taskId ? { ...task, task: editedTaskLabel } : task
      )
    );
    setEditingTaskId(null);
    setEditedTaskLabel('');
  };
  
  const handleActualCostChange = (taskId: string, value: string) => {
    const cost = value ? parseFloat(value) : undefined;
    setTimeline(prev => 
      prev!.map(task => 
        task.id === taskId ? { ...task, actualCost: cost } : task
      )
    );
  }

  const handleSaveTimeline = async () => {
    if (!timeline || !userId) return;
    setIsSaving(true);

    try {
        if (timelineId) {
            const timelineToUpdate: SavedTimeline = {
                id: timelineId,
                name: eventName,
                tasks: timeline,
                lastModified: new Date().toISOString(),
                initialBudget: initialBudget,
                costBreakdown: costBreakdown,
            };
            await updateTimeline(userId, timelineId, timelineToUpdate);
            toast({
                title: '✅ Timeline Updated!',
                description: `Your event plan "${eventName}" has been saved.`,
            });
        } else {
            const newSavedTimeline: Omit<SavedTimeline, 'id'> = {
                name: eventName,
                tasks: timeline,
                lastModified: new Date().toISOString(),
                initialBudget: initialBudget,
                costBreakdown: costBreakdown,
            };
            const newId = await saveTimeline(userId, newSavedTimeline);
            setTimelineId(newId);
            toast({
                title: '✅ Timeline Saved!',
                description: `Your event plan "${eventName}" has been saved.`,
            });
        }
    } catch (error) {
        console.error("Failed to save timeline:", error);
        toast({ title: "❌ Error", description: "Could not save the timeline.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const completedTasksCount = timeline?.filter(t => t.completed).length || 0;
  const totalTasks = timeline?.length || 0;
  const progress = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
  
  const totalEstimatedCost = timeline?.reduce((acc, task) => acc + (task.estimatedCost || 0), 0) || 0;
  const totalActualCost = timeline?.reduce((acc, task) => acc + (task.actualCost || 0), 0) || 0;
  const budgetRemaining = initialBudget - totalActualCost;
  const budgetProgress = initialBudget > 0 ? (totalActualCost / initialBudget) * 100 : 0;

  // Get event theme - THIS IS THE KEY ENHANCEMENT!
  const eventTheme = getEventTheme(eventName || formValues?.eventType || 'Event');

  const questions = formValues?.eventType ? getQuestionsForEventType(formValues.eventType) : [];

  return (
    <div className="space-y-8">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>🤖 AI-Powered Event Planner</CardTitle>
            <CardDescription>✨ Describe your event, and we'll generate a customized planning timeline for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFirstStepSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>🎉 Event Type</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                                placeholder="e.g., Wedding, Birthday..." 
                                value={eventTypeInput}
                                onChange={(e) => handleEventTypeChange(e.target.value)}
                                onFocus={() => setIsSuggestionBoxOpen(true)}
                                onBlur={() => setTimeout(() => setIsSuggestionBoxOpen(false), 150)}
                                autoComplete="off"
                            />
                            {isSuggestionBoxOpen && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-card border rounded-md shadow-lg mt-1">
                                    {suggestions.map(suggestion => (
                                        <div 
                                            key={suggestion} 
                                            className="p-2 hover:bg-muted cursor-pointer"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>📅 Event Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>👥 Guest Count</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>💰 Estimated Budget ($)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                   <Button type="submit" size="lg" className="w-full sm:w-auto">
                      ➡️ Next Step
                  </Button>
                  <Link href="/client/event-planner/saved" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" asChild className="w-full">
                        <div><List className="mr-2 h-4 w-4" /> 📋 View My Timelines</div>
                      </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && formValues && (
          <Card>
              <CardHeader>
                  <Button variant="ghost" onClick={() => setStep(1)} className="self-start px-2 mb-2">
                      <ArrowLeft className="mr-2 h-4 w-4" /> ⬅️ Back
                  </Button>
                  <CardTitle>🔍 Tell us more about your {formValues.eventType}</CardTitle>
                  <CardDescription>💡 Answering these questions will help us create a more detailed plan.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-6">
                      {questions.map(q => (
                          <div key={q.id}>
                              <Label className="text-base font-semibold">❓ {q.question}</Label>
                               <div className="mt-2 space-y-2">
                                  {q.options.map(option => (
                                    <div key={option} className="flex items-center">
                                      <Checkbox 
                                        id={`${q.id}-${option}`}
                                        checked={!!answers[option]}
                                        onCheckedChange={(checked) => {
                                          if (q.multiSelect) {
                                            setAnswers(prev => ({...prev, [option]: !!checked }));
                                          } else {
                                            const newAnswers = { ...answers };
                                            q.options.forEach(opt => {
                                              if (opt !== option) {
                                                delete newAnswers[opt];
                                              }
                                            });
                                            setAnswers({...newAnswers, [option]: !!checked });
                                          }
                                        }}
                                      />
                                      <label htmlFor={`${q.id}-${option}`} className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        ✨ {option}
                                      </label>
                                    </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                      <Button onClick={generatePlan} size="lg" className={eventTheme.buttonStyle}>
                          <Sparkles className="mr-2 h-4 w-4" /> 🚀 Generate Plan
                      </Button>
                  </div>
              </CardContent>
          </Card>
      )}

      {isLoading && (
        <div className="text-center p-8">
          <Loader className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">✨ Crafting your personalized event plan...</p>
        </div>
      )}

      {step === 3 && timeline && (
        <>
        {/* 🎉 CELEBRATION HEADER - NEW ENHANCED FEATURE! */}
        <CelebrationHeader
          eventName={eventName}
          theme={eventTheme}
          progress={progress}
          completedTasks={completedTasksCount}
          totalTasks={totalTasks}
        />

        {/* 📊 PROGRESS TRACKER - NOW WITH THEMES! */}
        <Card className={eventTheme.cardStyle}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                      <Button variant="ghost" onClick={() => { setTimeline(null); setStep(1); }} className="self-start px-0 mb-2 h-auto hover:bg-transparent">
                          <ArrowLeft className="mr-2 h-4 w-4" /> 🔄 Start Over
                      </Button>
                    <CardTitle style={{ color: eventTheme.accentColor }}>
                      {eventTheme.taskIcon} Progress Tracker
                    </CardTitle>
                    <CardDescription>Track your planning progress and celebrate each milestone!</CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={() => handleAddTask()} 
                        className={cn("flex-1 sm:flex-none", eventTheme.buttonStyle)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                    <Button 
                      onClick={handleSaveTimeline} 
                      disabled={isSaving || !userId} 
                      className={cn("flex-1 sm:flex-none", eventTheme.buttonStyle)}
                    >
                        {isSaving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : timelineId ? 'Save Changes' : 'Save Timeline'}
                    </Button>
                </div>
            </div>
          </CardHeader>
           <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <Label style={{ color: eventTheme.accentColor }}>📊 Task Progress</Label>
                    {/* 🎨 ANIMATED PROGRESS BAR - NEW! */}
                    <AnimatedProgress 
                      value={progress} 
                      theme={eventTheme}
                      showCelebration={progress > 0 && progress % 25 === 0}
                    />
                    <p className="text-sm text-muted-foreground">
                      {eventTheme.completedIcon} {completedTasksCount} of {totalTasks} tasks completed
                    </p>
                </div>
                 <div className="space-y-4">
                    <Label style={{ color: eventTheme.accentColor }}>💰 Budget Tracker</Label>
                    <Progress value={budgetProgress} className="h-4" />
                     <div className="flex justify-between text-sm text-muted-foreground">
                        <span>💸 Spent: ${totalActualCost.toLocaleString()}</span>
                        <span>💵 Remaining: ${budgetRemaining.toLocaleString()}</span>
                    </div>
                </div>
           </CardContent>
        </Card>
        
        {/* 📋 TIMELINE TASK LIST - ENHANCED WITH THEMES! */}
        <Card className={eventTheme.cardStyle}>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                        <CardTitle style={{ color: eventTheme.accentColor }}>
                          {viewMode === 'tasks' ? `${eventTheme.taskIcon} Event Timeline` : '💰 Cost Breakdown'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'tasks' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('tasks')}
                                className={viewMode === 'tasks' ? eventTheme.buttonStyle : ''}
                            >
                                <CheckSquare className="mr-2 h-4 w-4" />
                                Timeline
                            </Button>
                            <Button
                                variant={viewMode === 'breakdown' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('breakdown')}
                                className={viewMode === 'breakdown' ? eventTheme.buttonStyle : ''}
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Costs
                            </Button>
                        </div>
                    </div>
                    {viewMode === 'tasks' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCosts(!showCosts)}
                        >
                            {showCosts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            {showCosts ? 'Hide Costs' : 'Show Costs'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'tasks' ? (
                    <div className="relative mt-8 timeline-container">
            {/* 🎨 THEMED TIMELINE CENTER LINE - Behind tasks */}
                        <div
                          className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-5 pointer-events-none timeline-line"
                          style={{
                            width: '4px',
                            background: `linear-gradient(to bottom, ${eventTheme.primaryColor}, ${eventTheme.secondaryColor})`,
                            opacity: 0.45,
                            boxShadow: `0 0 12px ${eventTheme.primaryColor}33`
                          }}
                        ></div>
                        
                        <AnimatePresence>
                        {timeline.map((task, index) => {
                          // S-curve calculations for mobile
                          const isLeft = index % 2 === 0;
                          const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 768;
                          const amplitude = Math.min(screenWidth * 0.06, 30); // 6% of screen width, max 30px
                          const baseSpacing = isMobile ? 180 : 220; // Conservative spacing
                          const yPosition = index * baseSpacing;
                          
                          // Enhanced S-curve using sine wave for smooth transitions
                          const curveIntensity = Math.sin((index + 1) * Math.PI / 4) * amplitude;
                          const xOffset = isLeft ? -amplitude - curveIntensity : amplitude + curveIntensity;
                          
                          // Scale and rotation for depth effect
                          const scaleVariation = 0.95 + (Math.sin(index * 0.5) * 0.05);
                          const rotationAngle = isLeft ? -2 + curveIntensity * 0.1 : 2 - curveIntensity * 0.1;
                          
                          return (
                            <React.Fragment key={task.id}>
                           <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0, 
                              scale: 1,
                              x: isMobile ? xOffset : 0,
                              rotate: isMobile ? rotationAngle : 0
                            }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            whileHover={{ 
                              scale: isMobile ? scaleVariation * 1.02 : 1.02, 
                              y: -2,
                              rotate: isMobile ? rotationAngle * 1.1 : 0
                            }}
                            transition={{ 
                              duration: 0.4,
                              delay: index * 0.05,
                              type: "spring",
                              stiffness: 200,
                              damping: 25
                            }}
                            className="relative mb-8 group"
                            style={{
                              minHeight: isMobile ? '120px' : 'auto', // Prevent overlapping
                              zIndex: 50 + index // Layering for depth - above timeline line
                            }}
                            >
                            {isMobile ? (
                              // Mobile S-curve layout
                              <div className="w-full flex justify-center task-card-container">
                                <div className={cn(
                                  "w-full max-w-[280px] relative", // Constrained width for mobile
                                  isLeft ? "mr-8" : "ml-8" // Offset from center line
                                )}>
                                  {/* 🎨 THEMED TIMELINE DOT */}
                                  <div 
                                    className="absolute w-4 h-4 rounded-full border-4 border-background flex items-center justify-center z-20" 
                                    style={{ 
                                      backgroundColor: task.completed ? eventTheme.primaryColor : `${eventTheme.primaryColor}60`,
                                      left: isLeft ? 'calc(100% + 16px)' : '-32px',
                                      top: '8px'
                                    }}
                                  >
                                    <div className="w-2 h-2 rounded-full" 
                                         style={{ 
                                           backgroundColor: task.completed ? 'white' : eventTheme.primaryColor, 
                                           animation: task.completed ? 'none' : 'pulse 2s infinite' 
                                         }}></div>
                                  </div>

                                  {/* Mobile task card content */}
                                  <motion.div
                                      animate={{ 
                                          background: task.completed 
                                              ? `linear-gradient(to right, ${eventTheme.secondaryColor}40, transparent)`
                                              : 'transparent',
                                          opacity: task.completed ? 0.8 : 1
                                      }}
                                      className={cn(
                                        "rounded-xl shadow-lg p-4 space-y-3 transition-all duration-300 hover:shadow-xl relative z-30 bg-background",
                                        task.completed && "opacity-75"
                                      )}
                                      style={{
                                        border: `2px solid ${task.completed ? eventTheme.primaryColor : eventTheme.accentColor} !important`,
                                        boxShadow: task.completed 
                                          ? `0 6px 25px ${eventTheme.primaryColor}25`
                                          : `0 4px 15px ${eventTheme.accentColor}20`,
                                        transform: `scale(${scaleVariation})`,
                                        backgroundColor: 'hsl(var(--background))',
                                        position: 'relative',
                                        zIndex: 100
                                      }}
                                  >
                                    {/* Background blocker */}
                                    <div className="absolute inset-0 bg-background rounded-xl" style={{ zIndex: -1 }}></div>
                                    {/* Task completion celebration */}
                                    <AnimatePresence>
                                      {task.completed && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.8 }}
                                          className="absolute top-2 right-2 text-xl z-20"
                                        >
                                          {eventTheme.completedIcon}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    <div className="flex items-start justify-between gap-3">
                                        <div className='flex items-start gap-3 flex-1'>
                                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                <Checkbox 
                                                    id={`task-${task.id}`}
                                                    checked={task.completed}
                                                    onCheckedChange={() => handleTaskCheck(task.id)}
                                                    className="h-5 w-5 mt-1 flex-shrink-0"
                                                    style={{
                                                        borderColor: eventTheme.primaryColor,
                                                        backgroundColor: task.completed ? eventTheme.primaryColor : 'transparent'
                                                    }}
                                                />
                                            </motion.div>
                                            
                                            <div className="flex-1 min-w-0">
                                                 {editingTaskId === task.id ? (
                                                    <Input 
                                                        value={editedTaskLabel}
                                                        onChange={(e) => setEditedTaskLabel(e.target.value)}
                                                        className="text-sm font-semibold"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTask(task.id)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <motion.h4 
                                                        className={cn("text-sm font-semibold leading-tight", task.completed && 'line-through text-muted-foreground')}
                                                        animate={{ color: task.completed ? '#6b7280' : eventTheme.accentColor }}
                                                    >
                                                        <span className="mr-2">{eventTheme.taskIcon}</span>
                                                        {task.task}
                                                    </motion.h4>
                                                )}
                                                
                                                {/* Compact deadline */}
                                                <motion.div 
                                                    className="text-xs font-medium mt-1 flex items-center gap-1"
                                                    style={{ color: eventTheme.primaryColor }}
                                                >
                                                    📅 {new Date(task.deadline).toLocaleDateString(undefined, {
                                                        month: 'short', 
                                                        day: 'numeric'
                                                    })}
                                                </motion.div>
                                                
                                                {task.description && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                    >
                                                        <motion.p 
                                                            className={cn(
                                                                "text-xs text-muted-foreground mt-2 leading-relaxed",
                                                                !expandedTasks.has(task.id) && "line-clamp-2"
                                                            )}
                                                        >
                                                            📝 {task.description}
                                                        </motion.p>
                                                        {shouldShowToggle(task.description, true) && (
                                                            <button
                                                                onClick={() => toggleTaskExpansion(task.id)}
                                                                className="text-xs mt-1 font-medium hover:underline show-more-button"
                                                                style={{ color: eventTheme.primaryColor }}
                                                            >
                                                                {expandedTasks.has(task.id) ? 'Show less' : 'Show more'}
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                                
                                                {task.suggestedVendorCategory && (
                                                    <motion.div 
                                                        className="mt-2"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                    >
                                                        <span 
                                                            className="text-xs px-2 py-1 rounded-full font-medium"
                                                            style={{ 
                                                                backgroundColor: `${eventTheme.primaryColor}20`,
                                                                color: eventTheme.accentColor
                                                            }}
                                                        >
                                                            💡 {task.suggestedVendorCategory}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Always visible action buttons on mobile */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {editingTaskId === task.id ? (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => handleSaveTask(task.id)}
                                                    className="text-green-600 hover:bg-green-100 h-7 w-7 p-0"
                                                >
                                                    <Save className="h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => handleEditTask(task)}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="text-destructive hover:bg-red-100 h-7 w-7 p-0"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Compact cost information for mobile */}
                                    {showCosts && (
                                        <motion.div 
                                            className="grid grid-cols-1 gap-2 p-3 rounded-lg mt-3"
                                            style={{ backgroundColor: `${eventTheme.secondaryColor}30` }}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            {task.estimatedCost > 0 && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3" style={{ color: eventTheme.primaryColor }} />
                                                        <span className="font-medium">Est:</span>
                                                    </span>
                                                    <span>${task.estimatedCost.toLocaleString()}</span>
                                                </div>
                                            )}
                                            
                                            {task.recommendedCost && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3" style={{ color: eventTheme.accentColor }} />
                                                        <span className="font-medium">Rec:</span>
                                                    </span>
                                                    <span>${task.recommendedCost.toLocaleString()}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`actual-cost-${task.id}`} className="text-xs font-medium">
                                                    💰 Actual
                                                </Label>
                                                <div className="relative w-20">
                                                    <Input
                                                        id={`actual-cost-${task.id}`}
                                                        type="number"
                                                        placeholder="0"
                                                        value={task.actualCost ?? ''}
                                                        onChange={(e) => handleActualCostChange(task.id, e.target.value)}
                                                        className="pl-4 h-6 text-xs w-full"
                                                    />
                                                    <DollarSign className="absolute left-1 top-1/2 transform -translate-y-1/2 h-2 w-2 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                  </motion.div>
                                </div>
                              </div>
                            ) : (
                              // Desktop layout (existing)
                              <div className="grid grid-cols-2 items-start gap-x-8 task-card-container">
                                <div className={cn(
                                    "text-right",
                                    index % 2 === 0 ? "text-right" : "col-start-2 text-left"
                                )}>
                                </div>

                                {/* 🎨 THEMED TIMELINE DOT */}
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-background flex items-center justify-center z-20" 
                                  style={{ backgroundColor: task.completed ? eventTheme.primaryColor : `${eventTheme.primaryColor}60` }}>
                                    <div className="w-2 h-2 rounded-full" 
                                         style={{ 
                                           backgroundColor: task.completed ? 'white' : eventTheme.primaryColor, 
                                           animation: task.completed ? 'none' : 'pulse 2s infinite' 
                                         }}></div>
                                </div>

                                <div className={cn(
                                    "col-start-2",
                                    index % 2 === 0 ? 'col-start-2' : 'col-start-1 row-start-1'
                                )}>
                                    <motion.div
                                        animate={{ 
                                            background: task.completed 
                                                ? `linear-gradient(to right, ${eventTheme.secondaryColor}40, transparent)`
                                                : 'transparent',
                                            opacity: task.completed ? 0.8 : 1
                                        }}
                    className={cn(
                      "rounded-xl shadow-sm p-6 space-y-3 transition-all duration-300 hover:shadow-lg relative z-30 bg-background",
                      task.completed && "opacity-75"
                    )}
                    style={{
                      border: `2px solid ${task.completed ? eventTheme.primaryColor : eventTheme.accentColor} !important`,
                      boxShadow: task.completed 
                        ? `0 4px 20px ${eventTheme.primaryColor}20`
                        : `0 2px 10px ${eventTheme.accentColor}20`,
                      backgroundColor: 'hsl(var(--background))',
                      position: 'relative',
                      zIndex: 100
                    }}
                                    >
                                        {/* Background blocker */}
                                        <div className="absolute inset-0 bg-background rounded-xl" style={{ zIndex: -1 }}></div>
                                        {/* 🎉 TASK COMPLETION CELEBRATION */}
                                        <AnimatePresence>
                                          {task.completed && (
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              className="absolute top-2 right-2 text-2xl z-20"
                                            >
                                              {eventTheme.completedIcon}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>

                                        <div className="flex items-start justify-between gap-4">
                                            <div className='flex items-start gap-4'>
                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                    <Checkbox 
                                                        id={`task-${task.id}`}
                                                        checked={task.completed}
                                                        onCheckedChange={() => handleTaskCheck(task.id)}
                                                        className="h-6 w-6 mt-1"
                                                        style={{
                                                            borderColor: eventTheme.primaryColor,
                                                            backgroundColor: task.completed ? eventTheme.primaryColor : 'transparent'
                                                        }}
                                                    />
                                                </motion.div>
                                                
                                                <div className="flex-1">
                                                     {editingTaskId === task.id ? (
                                                        <Input 
                                                            value={editedTaskLabel}
                                                            onChange={(e) => setEditedTaskLabel(e.target.value)}
                                                            className="text-lg font-semibold"
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTask(task.id)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <motion.h4 
                                                            className={cn("text-lg font-semibold leading-tight", task.completed && 'line-through text-muted-foreground')}
                                                            animate={{ color: task.completed ? '#6b7280' : eventTheme.accentColor }}
                                                        >
                                                            <span className="mr-2">{eventTheme.taskIcon}</span>
                                                            {task.task}
                                                        </motion.h4>
                                                    )}
                                                    
                                                    {/* Deadline with urgency styling */}
                                                    <div className="flex items-center gap-4 text-sm mt-2">
                                                        <motion.div 
                                                            className="font-semibold flex items-center gap-1"
                                                            style={{ color: eventTheme.primaryColor }}
                                                        >
                                                            📅 {new Date(task.deadline).toLocaleDateString(undefined, {
                                                                month: 'long', 
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </motion.div>
                                                    </div>
                                                    
                                                    {task.description && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.2 }}
                                                        >
                                                            <motion.p 
                                                                className={cn(
                                                                    "text-sm text-muted-foreground mt-3 leading-relaxed",
                                                                    !expandedTasks.has(task.id) && "line-clamp-3"
                                                                )}
                                                            >
                                                                📝 {task.description}
                                                            </motion.p>
                                                            {shouldShowToggle(task.description, false) && (
                                                                <button
                                                                    onClick={() => toggleTaskExpansion(task.id)}
                                                                    className="text-sm mt-2 font-medium hover:underline show-more-button"
                                                                    style={{ color: eventTheme.primaryColor }}
                                                                >
                                                                    {expandedTasks.has(task.id) ? 'Show less' : 'Show more'}
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                    
                                                    {task.suggestedVendorCategory && (
                                                        <motion.div 
                                                            className="flex items-center gap-2 mt-3"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.3 }}
                                                        >
                                                            <span 
                                                                className="text-xs px-3 py-1 rounded-full font-medium"
                                                                style={{ 
                                                                    backgroundColor: `${eventTheme.primaryColor}20`,
                                                                    color: eventTheme.accentColor
                                                                }}
                                                            >
                                                                💡 Suggested: {task.suggestedVendorCategory}
                                                            </span>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingTaskId === task.id ? (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        onClick={() => handleSaveTask(task.id)}
                                                        className="text-green-600 hover:bg-green-100"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        onClick={() => handleEditTask(task)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-destructive hover:bg-red-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Cost information */}
                                        {showCosts && (
                                            <motion.div 
                                                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg mt-4"
                                                style={{ backgroundColor: `${eventTheme.secondaryColor}30` }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                {task.estimatedCost > 0 && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="h-4 w-4" style={{ color: eventTheme.primaryColor }} />
                                                        <span className="font-medium">Estimated:</span>
                                                        <span>${task.estimatedCost.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                
                                                {task.recommendedCost && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="h-4 w-4" style={{ color: eventTheme.accentColor }} />
                                                        <span className="font-medium">Recommended:</span>
                                                        <span>${task.recommendedCost.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex flex-col gap-1">
                                                    <Label htmlFor={`actual-cost-${task.id}`} className="text-xs font-medium">
                                                        💰 Actual Cost
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id={`actual-cost-${task.id}`}
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={task.actualCost ?? ''}
                                                            onChange={(e) => handleActualCostChange(task.id, e.target.value)}
                                                            className="pl-7 h-8 text-sm"
                                                        />
                                                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                              </div>
                            )}
                            
                           </motion.div>
                           
                           {/* Add task button between timeline items - centered on line */}
                           <motion.div 
                             className="relative flex justify-center z-30 my-4"
                             initial={{ opacity: 1 }}
                             animate={{ opacity: 1 }}
                             transition={{ duration: 0.2 }}
                           >
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleAddTask(index + 1)}
                               className={cn(
                                 "rounded-full h-8 w-8 p-0 shadow-md hover:shadow-lg transition-all duration-200 add-task-button",
                                 isMobile ? "border-2" : ""
                               )}
                               style={{ 
                                 borderColor: eventTheme.primaryColor,
                                 color: eventTheme.primaryColor,
                                 backgroundColor: 'white'
                               }}
                             >
                               <PlusCircle className="h-4 w-4" />
                             </Button>
                           </motion.div>
                           </React.Fragment>
                          );
                        })
                        }
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {costBreakdown.length > 0 ? (
                            <>
                                {costBreakdown.map((item, index) => (
                                    <motion.div
                                        key={item.category}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={cn("border rounded-lg p-6", eventTheme.cardStyle)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg" style={{ color: eventTheme.accentColor }}>
                                                    {item.category === 'Venues' && '🏛️'} 
                                                    {item.category === 'Catering & Sweets' && '🍽️'} 
                                                    {item.category === 'Entertainment' && '🎵'} 
                                                    {item.category === 'Photography & Videography' && '📸'} 
                                                    {item.category === 'Decoration' && '🌸'} 
                                                    {item.category === 'Transportation' && '🚗'} 
                                                    {item.category === 'Miscellaneous' && '📦'} 
                                                    {' '}{item.category}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">📝 {item.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">📊 {item.percentage}% of budget</p>
                                            </div>
                                            <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: eventTheme.primaryColor }}>
                          💰 {costType === 'estimated' ? (item.estimatedCost > 0 ? `$${item.estimatedCost.toLocaleString()}` : '—') : (item.recommendedCost > 0 ? `$${item.recommendedCost.toLocaleString()}` : '—')}
                        </div>
                        {costType === 'estimated' && (item.recommendedCost || 0) !== item.estimatedCost && (
                          <div className="text-sm" style={{ color: eventTheme.accentColor }}>
                            ⭐ Rec: {(item.recommendedCost && item.recommendedCost > 0) ? `$${item.recommendedCost.toLocaleString()}` : '—'}
                          </div>
                        )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>📊 Budget allocation</span>
                                                <span>{item.percentage}%</span>
                                            </div>
                                            <Progress 
                                                value={item.percentage} 
                                                className="h-2" 
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💰</div>
                                <h3 className="text-lg font-semibold mb-2">No Cost Breakdown Available</h3>
                                <p className="text-muted-foreground">
                                    🔄 Generate a new timeline to see detailed cost breakdowns.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
      
        {/* Undo Delete Toast */}
        <AnimatePresence>
          {showUndoToast && deletedTask && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 right-6 z-[9999]"
            >
              <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[280px]">
                <div className="flex-1">
                  <p className="text-sm font-medium">Task deleted</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {deletedTask.task.task}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUndoDelete}
                  className="text-xs"
                >
                  Undo
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
      )}
    </div>
  );
}

export default function EventPlannerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EventPlannerContent />
        </Suspense>
    )
}