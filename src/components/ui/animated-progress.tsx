"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { EventTheme, getRandomCelebrationEmoji } from "@/lib/event-themes"

interface AnimatedProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  theme: EventTheme
  showCelebration?: boolean
}

const AnimatedProgress = React.forwardRef<HTMLDivElement, AnimatedProgressProps>(
  ({ className, value = 0, theme, showCelebration = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(0)
    const [celebrationEmojis, setCelebrationEmojis] = React.useState<string[]>([])

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayValue(value)
      }, 100)
      return () => clearTimeout(timer)
    }, [value])

    React.useEffect(() => {
      if (showCelebration && value > 0) {
        const emojis = Array.from({ length: 5 }, () => getRandomCelebrationEmoji(theme))
        setCelebrationEmojis(emojis)
        const timer = setTimeout(() => setCelebrationEmojis([]), 2000)
        return () => clearTimeout(timer)
      }
    }, [showCelebration, value, theme])

    return (
      <div className="relative">
        <div
          ref={ref}
          className={cn(
            "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
            className
          )}
          {...props}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: theme.gradient,
              boxShadow: `0 0 10px ${theme.primaryColor}40`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${displayValue}%` }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
          />
          
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "linear"
            }}
          />
        </div>

        {/* Celebration emojis */}
        {celebrationEmojis.map((emoji, index) => (
          <motion.div
            key={index}
            className="absolute text-2xl pointer-events-none"
            initial={{ 
              x: `${(displayValue / 100) * 100}%`, 
              y: 0, 
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              x: `${(displayValue / 100) * 100 + (index - 2) * 20}%`, 
              y: -40, 
              opacity: 1,
              scale: 1
            }}
            exit={{ 
              y: -60, 
              opacity: 0,
              scale: 0
            }}
            transition={{ 
              duration: 0.6,
              delay: index * 0.1,
              ease: "easeOut"
            }}
          >
            {emoji}
          </motion.div>
        ))}

        {/* Progress percentage */}
        <motion.div
          className="absolute right-0 top-0 transform -translate-y-8 text-sm font-semibold"
          style={{ color: theme.primaryColor }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(displayValue)}%
        </motion.div>
      </div>
    )
  }
)
AnimatedProgress.displayName = "AnimatedProgress"

export { AnimatedProgress }