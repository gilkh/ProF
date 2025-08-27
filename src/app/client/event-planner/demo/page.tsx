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
    task: 'Book the perfect venue',
    deadline: '2024-03-15',
    estimatedCost: 5000,
    recommendedCost: 6500,
    actualCost: 5800,
    completed: true,
    suggestedVendorCategory: 'Venues',
    description: 'Find and secure the ideal location for your special celebration'
  },
  {
    id: '2',
    task: 'Arrange catering services',
    deadline: '2024-04-01',
    estimatedCost: 3500,
    recommendedCost: 4200,
    completed: true,
    suggestedVendorCategory: 'Catering & Sweets',
    description: 'Plan delicious menu options that will delight your guests'
  },
  {
    id: '3',
    task: 'Hire professional photographer',
    deadline: '2024-04-10',
    estimatedCost: 2000,
    recommendedCost: 2800,
    completed: false,
    suggestedVendorCategory: 'Photography & Videography',
    description: 'Capture all the precious moments of your celebration'
  },
  {
    id: '4',
    task: 'Plan decorations and flowers',
    deadline: '2024-04-20',
    estimatedCost: 1500,
    recommendedCost: 2100,
    completed: false,
    suggestedVendorCategory: 'Decoration',
    description: 'Create a beautiful atmosphere with stunning decorations'
  }
];

export default function EventPlannerDemo() {
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
      <Card>
        <CardHeader>
          <CardTitle>🎨 Enhanced Event Planner Demo</CardTitle>
          <CardDescription>
            Experience the new lively and themed event planning interface! 
            Select different event types to see how the interface adapts with unique colors, emojis, and animations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Choose an Event Type:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {demoEvents.map(event => (
                  <Button
                    key={event}
                    variant={selectedEvent === event ? 'default' : 'outline'}
                    onClick={() => setSelectedEvent(event)}
                    className="text-sm"
                  >
                    {getEventTheme(event).emoji} {event}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
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
          <CardDescription>Watch the progress come alive with themed animations!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card className={eventTheme.cardStyle}>
        <CardHeader>
          <CardTitle style={{ color: eventTheme.accentColor }}>
            {eventTheme.taskIcon} Event Tasks
          </CardTitle>
          <CardDescription>
            Interactive task cards with theme-specific styling and animations
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

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>✨ New Features</CardTitle>
          <CardDescription>What makes this event planner more lively and engaging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">🎨 Dynamic Theming</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Unique color schemes for each event type</li>
                <li>• Event-specific emojis and icons</li>
                <li>• Themed gradients and styling</li>
                <li>• Contextual motivational messages</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">🎉 Celebrations & Animations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Confetti effects when completing tasks</li>
                <li>• Animated progress bars with celebrations</li>
                <li>• Milestone achievement notifications</li>
                <li>• Smooth transitions and hover effects</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">💫 Enhanced Interactions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Priority-based task styling</li>
                <li>• Deadline urgency indicators</li>
                <li>• Interactive task completion messages</li>
                <li>• Floating celebration emojis</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">🎯 Event-Specific Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Wedding: Rose themes with romantic elements</li>
                <li>• Birthday: Green themes with party vibes</li>
                <li>• Corporate: Professional slate styling</li>
                <li>• Religious: Spiritual violet themes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}