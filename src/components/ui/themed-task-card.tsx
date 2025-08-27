"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { EventTask } from "@/lib/types"
import { EventTheme, getTaskPriorityStyle, getRandomTaskCompletionMessage, generateConfetti } from "@/lib/event-themes"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Save, Trash2, DollarSign, PlusCircle } from "lucide-react"

interface ThemedTaskCardProps {
  task: EventTask
  theme: EventTheme
  index: number
  isEditing: boolean
  editedLabel: string
  onTaskCheck: (taskId: string) => void
  onEditTask: (task: EventTask) => void
  onSaveTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onActualCostChange: (taskId: string, value: string) => void
  onAddTask: (index: number) => void
  onEditLabelChange: (value: string) => void
  showCosts: boolean
}

export function ThemedTaskCard({
  task,
  theme,
  index,
  isEditing,
  editedLabel,
  onTaskCheck,
  onEditTask,
  onSaveTask,
  onDeleteTask,
  onActualCostChange,
  onAddTask,
  onEditLabelChange,
  showCosts
}: ThemedTaskCardProps) {
  const [justCompleted, setJustCompleted] = React.useState(false)
  const [showCompletionMessage, setShowCompletionMessage] = React.useState(false)

  const handleTaskCheck = () => {
    if (!task.completed) {
      setJustCompleted(true)
      setShowCompletionMessage(true)
      generateConfetti(theme)
      
      setTimeout(() => {
        setShowCompletionMessage(false)
      }, 3000)
      
      setTimeout(() => {
        setJustCompleted(false)
      }, 1000)
    }
    onTaskCheck(task.id)
  }

  const priorityStyle = getTaskPriorityStyle(task, theme)
  const deadline = new Date(task.deadline)
  const now = new Date()
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const getDeadlineColor = () => {
    if (daysUntilDeadline < 0) return 'text-red-600'
    if (daysUntilDeadline <= 7) return 'text-yellow-600'
    if (daysUntilDeadline <= 30) return 'text-orange-500'
    return 'text-green-600'
  }

  const getDeadlineText = () => {
    if (daysUntilDeadline < 0) return `${Math.abs(daysUntilDeadline)} days overdue`
    if (daysUntilDeadline === 0) return 'Due today!'
    if (daysUntilDeadline === 1) return 'Due tomorrow'
    return `${daysUntilDeadline} days remaining`
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          background: task.completed 
            ? `linear-gradient(to right, ${theme.secondaryColor}40, transparent)`
            : 'transparent'
        }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className={cn(
          "relative group p-6 rounded-xl border-2 transition-all duration-300",
          theme.cardStyle,
          priorityStyle,
          task.completed && "opacity-75",
          justCompleted && "animate-pulse"
        )}
        style={{
          boxShadow: task.completed 
            ? `0 4px 20px ${theme.primaryColor}20`
            : `0 2px 12px ${theme.accentColor}22`,
          borderColor: task.completed ? theme.primaryColor : theme.accentColor
        }}
      >
        {/* Completion celebration overlay */}
        <AnimatePresence>
          {showCompletionMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl z-10"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{theme.completedIcon}</div>
                <div className="text-lg font-semibold" style={{ color: theme.primaryColor }}>
                  {getRandomTaskCompletionMessage(theme)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={handleTaskCheck}
              className="h-6 w-6 mt-1"
              style={{
                borderColor: theme.primaryColor,
                backgroundColor: task.completed ? theme.primaryColor : 'transparent'
              }}
            />
          </motion.div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedLabel}
                    onChange={(e) => onEditLabelChange(e.target.value)}
                    className="text-lg font-semibold"
                    onKeyDown={(e) => e.key === 'Enter' && onSaveTask(task.id)}
                    autoFocus
                  />
                ) : (
                  <motion.h4 
                    className={cn(
                      "text-lg font-semibold leading-tight",
                      task.completed && 'line-through text-muted-foreground'
                    )}
                    animate={{ 
                      color: task.completed ? '#6b7280' : theme.accentColor 
                    }}
                  >
                    <span className="mr-2">{theme.taskIcon}</span>
                    {task.task}
                  </motion.h4>
                )}
              </div>

              <div className="flex items-center gap-1 ml-4">
                {isEditing ? (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onSaveTask(task.id)}
                    className="text-green-600 hover:bg-green-100"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onEditTask(task)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Deadline and priority indicator */}
            <div className="flex items-center gap-4 text-sm">
              <motion.div 
                className={cn("font-semibold", getDeadlineColor())}
                animate={{ scale: daysUntilDeadline <= 7 ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 2, repeat: daysUntilDeadline <= 7 ? Infinity : 0 }}
              >
                📅 {deadline.toLocaleDateString(undefined, {
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </motion.div>
              <div className={cn("text-xs px-2 py-1 rounded-full", getDeadlineColor())}>
                {getDeadlineText()}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <motion.p 
                className="text-sm text-muted-foreground leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                📝 {task.description}
              </motion.p>
            )}

            {/* Suggested vendor category */}
            {task.suggestedVendorCategory && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span 
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ 
                    backgroundColor: `${theme.primaryColor}20`,
                    color: theme.accentColor
                  }}
                >
                  💡 Suggested: {task.suggestedVendorCategory}
                </span>
              </motion.div>
            )}

            {/* Cost information */}
            {showCosts && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg"
                style={{ backgroundColor: `${theme.secondaryColor}30` }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  <span className="font-medium">Estimated:</span>
                  <span>{(typeof task.estimatedCost === 'number' && task.estimatedCost > 0) ? `$${task.estimatedCost.toLocaleString()}` : '—'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" style={{ color: theme.accentColor }} />
                  <span className="font-medium">Recommended:</span>
                  <span>{(typeof task.recommendedCost === 'number' && task.recommendedCost > 0) ? `$${task.recommendedCost.toLocaleString()}` : '—'}</span>
                </div>
                
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
                      onChange={(e) => onActualCostChange(task.id, e.target.value)}
                      className="pl-7 h-8 text-sm"
                    />
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Add task button between cards */}
      <motion.div 
        className="relative flex justify-center -my-2 z-40"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddTask(index + 1)}
          className="rounded-full h-8 w-8 p-0 bg-white shadow-md hover:shadow-lg transition-all duration-200"
          style={{ 
            borderColor: theme.primaryColor,
            color: theme.primaryColor
          }}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </motion.div>
    </>
  )
}