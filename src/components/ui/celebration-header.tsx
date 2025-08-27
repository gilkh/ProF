"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { EventTheme, getRandomMotivationalMessage, getRandomCelebrationEmoji } from "@/lib/event-themes"
import { cn } from "@/lib/utils"

interface CelebrationHeaderProps {
  eventName: string
  theme: EventTheme
  progress: number
  completedTasks: number
  totalTasks: number
  className?: string
}

export function CelebrationHeader({
  eventName,
  theme,
  progress,
  completedTasks,
  totalTasks,
  className
}: CelebrationHeaderProps) {
  const [motivationalMessage, setMotivationalMessage] = React.useState("")
  const [floatingEmojis, setFloatingEmojis] = React.useState<string[]>([])

  React.useEffect(() => {
    setMotivationalMessage(getRandomMotivationalMessage(theme))
  }, [theme])

  React.useEffect(() => {
    if (progress > 0 && progress % 25 === 0) {
      // Add floating emojis at milestone progress
      const emojis = Array.from({ length: 3 }, () => getRandomCelebrationEmoji(theme))
      setFloatingEmojis(emojis)
      
      const timer = setTimeout(() => {
        setFloatingEmojis([])
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [progress, theme])

  const getMilestoneMessage = () => {
    if (progress === 100) return "🎉 Congratulations! Your event is fully planned!"
    if (progress >= 75) return "🌟 Almost there! You're doing amazing!"
    if (progress >= 50) return "🚀 Halfway there! Keep up the great work!"
    if (progress >= 25) return "✨ Great start! You're making excellent progress!"
    return motivationalMessage
  }

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl p-8 text-center",
        theme.headerStyle,
        className
      )}
      style={{
        background: theme.gradient,
        boxShadow: `0 8px 32px ${theme.primaryColor}20`
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${theme.primaryColor} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${theme.secondaryColor} 0%, transparent 50%), radial-gradient(circle at 40% 80%, ${theme.accentColor} 0%, transparent 50%)`
        }}
      />

      {/* Floating celebration emojis */}
      <AnimatePresence>
        {floatingEmojis.map((emoji, index) => (
          <motion.div
            key={`${emoji}-${index}`}
            className="absolute text-4xl pointer-events-none"
            initial={{ 
              x: Math.random() * 100 + "%",
              y: "100%",
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              x: Math.random() * 100 + "%",
              y: "-20%",
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.8],
              rotate: [0, 180, 360]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 3,
              delay: index * 0.2,
              ease: "easeOut"
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Event emoji and title */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.span 
            className="text-6xl"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {theme.emoji}
          </motion.span>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white"
            style={{ textShadow: `2px 2px 4px ${theme.accentColor}40` }}
          >
            {eventName}
          </motion.h1>
        </motion.div>

        {/* Progress summary */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="text-2xl font-semibold text-white mb-2">
            {completedTasks} of {totalTasks} tasks completed
          </div>
          <div className="text-lg text-white/90">
            {Math.round(progress)}% complete
          </div>
        </motion.div>

        {/* Motivational message */}
        <motion.div
          className="text-xl text-white/95 font-medium max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          key={getMilestoneMessage()} // Re-animate when message changes
        >
          {getMilestoneMessage()}
        </motion.div>

        {/* Celebration message for milestones */}
        <AnimatePresence>
          {progress > 0 && progress % 25 === 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-6xl">
                {progress === 100 ? "🎊" : "🎉"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sparkle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              repeatDelay: 1
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}