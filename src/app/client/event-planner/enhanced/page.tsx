'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventTheme } from '@/lib/event-themes';
import { CelebrationHeader } from '@/components/ui/celebration-header';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { ThemedTaskCard } from '@/components/ui/themed-task-card';
import { motion } from 'framer-motion';
import type { EventTask } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const demoEvents = [
  'Lebanese Wedding',
  'Anniversary',
  'Birthday Party', 
  'Graduation Party',
  'Baby Shower',
  'Corporate Conference',
  'Baptism',
  'Christmas Celebration'
];

const sampleTasks: EventTask[] = [
  {
    id: '1',
    task: 'Book the perfect venue for your celebration',
    deadline: '2024-03-15',
    estimatedCost: 5000,
    recommendedCost: 6500,
    actualCost: 5800,
    completed: true,
    suggestedVendorCategory: 'Venues',
    description: 'Find and secure the ideal location that matches your vision and guest count'
  },
  {
    id: '2', 
    task: 'Arrange delicious catering services',
    deadline: '2024-04-01',
    estimatedCost: 3500,
    recommendedCost: 4200,
    completed: true,
    suggestedVendorCategory: 'Catering & Sweets',
    description: 'Plan a memorable menu that will delight your guests with amazing flavors'
  },
  {
    id: '3',
    task: 'Hire professional photographer',
    deadline: '2024-04-10', 
    estimatedCost: 2000,
    recommendedCost: 2800,
    completed: false,
    suggestedVendorCategory: 'Photography & Videography',
    description: 'Capture all the precious moments and emotions of your special day'
  },
  {
    id: '4',
    task: 'Plan stunning decorations and flowers',
    deadline: '2024-04-20',
    estimatedCost: 1500,
    recommendedCost: 2100, 
    completed: false,
    suggestedVendorCategory: 'Decoration',
    description: 'Create a beautiful atmosphere that reflects your style and theme'
  },
  {
    id: '5',
    task: 'Send beautiful invitations',
    deadline: '2024-03-25',
    estimatedCost: 300,
    recommendedCost: 450,
    completed: false,
    suggestedVendorCategory: 'Invitations & Printables',
    description: 'Design and send invitations that set the perfect tone for your event'
  }
];

export default function EnhancedEventPlanner() {
  const [selectedEvent, setSelectedEvent] = useState('Lebanese Wedding');
  const [tasks, setTasks] = useState<EventTask[]>(sampleTasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskLabel, setEditedTaskLabel] = useState('');

  const eventTheme = getEventTheme(selectedEvent);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleTaskCheck = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleEditTask = (task: EventTask) => {
    setEditingTaskId(task.id);
    setEditedTaskLabel(task.task);
  };

  const handleSaveTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, task: editedTaskLabel } : task
      )
    );
    setEditingTaskId(null);
    setEditedTaskLabel('');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleActualCostChange = (taskId: string, value: string) => {
    const cost = value ? parseFloat(value) : undefined;
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, actualCost: cost } : task
      )
    );
  };

  const handleAddTask = (index?: number) => {
    const newTask: EventTask = {
      id: `demo-${Date.now()}`,
      task: '✨ New Task - Click edit to change',
      deadline: new Date().toISOString().split('T')[0],
      estimatedCost: 500,
      completed: false,
    };
    
    setTasks(prev => {
      const newTasks = [...prev];
      if (index !== undefined) {
          newTasks.splice(index, 0, newTask);
      } else {
          newTasks.push(newTask);
      }
      return newTasks;
    });
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Link href="/client/event-planner">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Original
              </Button>
            </Link>
            <div>
              <CardTitle className="text-2xl">🎨 Enhanced Event Planner</CardTitle>
              <CardDescription>
                Experience the new lively and themed event planning interface! 
                Select different event types to see dynamic themes, colors, and celebrations.
              </CardDescription>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Choose Your Event Type:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {demoEvents.map(event => (
                  <Button
                    key={event}
                    variant={selectedEvent === event ? 'default' : 'outline'}
                    onClick={() => setSelectedEvent(event)}
                    className={selectedEvent === event ? getEventTheme(event).buttonStyle : ''}
                  >
                    {getEventTheme(event).emoji} {event.replace('Lebanese ', '')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Celebration Header */}
      <CelebrationHeader
        eventName={selectedEvent}
        theme={eventTheme}
        progress={progress}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
      />

      {/* Progress Card */}
      <Card className={eventTheme.cardStyle}>
        <CardHeader>
          <CardTitle style={{ color: eventTheme.accentColor }}>
            {eventTheme.taskIcon} Progress Tracker
          </CardTitle>
          <CardDescription>Watch your progress come alive with themed animations and celebrations!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: eventTheme.accentColor }} className="font-semibold">
                  📊 Task Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {completedTasks} of {totalTasks} completed
                </span>
              </div>
              <AnimatedProgress 
                value={progress} 
                theme={eventTheme}
                showCelebration={progress > 0 && progress % 25 === 0}
              />
              <p className="text-sm text-muted-foreground text-center">
                {eventTheme.completedIcon} Complete tasks to see celebration animations!
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: eventTheme.accentColor }} className="font-semibold">
                  💰 Budget Overview
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Estimated Total:</span>
                  <span className="font-semibold">${tasks.reduce((acc, task) => acc + (task.estimatedCost || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Actual Spent:</span>
                  <span className="font-semibold">${tasks.reduce((acc, task) => acc + (task.actualCost || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card className={eventTheme.cardStyle}>
        <CardHeader>
          <CardTitle style={{ color: eventTheme.accentColor }}>
            {eventTheme.taskIcon} Event Planning Tasks
          </CardTitle>
          <CardDescription>
            Interactive task cards with theme-specific styling, animations, and celebrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {tasks.map((task, index) => (
              <ThemedTaskCard
                key={task.id}
                task={task}
                theme={eventTheme}
                index={index}
                isEditing={editingTaskId === task.id}
                editedLabel={editedTaskLabel}
                onTaskCheck={handleTaskCheck}
                onEditTask={handleEditTask}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onActualCostChange={handleActualCostChange}
                onAddTask={handleAddTask}
                onEditLabelChange={setEditedTaskLabel}
                showCosts={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>✨ What's New & Enhanced</CardTitle>
          <CardDescription>See the difference these enhancements make to your planning experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                🎨 <span>Dynamic Theming</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Unique colors for each event type</li>
                <li>• Event-specific emojis and icons</li>
                <li>• Themed gradients and styling</li>
                <li>• Contextual motivational messages</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                🎉 <span>Celebrations</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Confetti when completing tasks</li>
                <li>• Animated progress celebrations</li>
                <li>• Milestone achievement messages</li>
                <li>• Floating celebration emojis</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                💫 <span>Enhanced UX</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Priority-based task styling</li>
                <li>• Deadline urgency indicators</li>
                <li>• Smooth hover animations</li>
                <li>• Interactive completion feedback</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: `${eventTheme.secondaryColor}20` }}>
            <h4 className="font-semibold text-lg mb-3" style={{ color: eventTheme.accentColor }}>
              🎯 Current Theme: {eventTheme.name}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {eventTheme.celebrationMessage}
            </p>
            <div className="flex flex-wrap gap-2">
              {eventTheme.celebrationEmojis.map((emoji, index) => (
                <span key={index} className="text-2xl animate-pulse" style={{ animationDelay: `${index * 0.2}s` }}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}