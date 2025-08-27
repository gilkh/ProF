
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types for props
interface TimelineTask {
    id: string;
    completed: boolean;
    // Add other task properties as needed
}

interface EventTheme {
    primaryColor: string;
    secondaryColor: string;
}

interface TimelineFixProps {
    timeline: TimelineTask[];
    eventTheme: EventTheme;
    handleAddTask: (index: number) => void;
    // Add other props as needed
}

const TimelineFix: React.FC<TimelineFixProps> = ({ timeline, eventTheme, handleAddTask }) => (
    <div className="relative mt-8">
        {/* 🎨 THEMED TIMELINE CENTER LINE - Made more visible */}
        <div
            className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-10"
            style={{ background: `linear-gradient(to bottom, ${eventTheme.primaryColor}, ${eventTheme.secondaryColor})` }}
        ></div>

        <AnimatePresence>
            {timeline.map((task, index) => (
                <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                    className="relative mb-8 group"
                >
                    <div className="grid grid-cols-2 items-start gap-x-8">
                        <div
                            className={cn(
                                index % 2 === 0 ? "text-right" : "col-start-2 text-left"
                            )}
                        >
                            {/* You can add task content here if needed */}
                        </div>

                        {/* 🎨 THEMED TIMELINE DOT - Higher z-index */}
                        <div
                            className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-background flex items-center justify-center z-20"
                            style={{
                                backgroundColor: task.completed
                                    ? eventTheme.primaryColor
                                    : `${eventTheme.primaryColor}30`,
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: task.completed ? "white" : eventTheme.primaryColor,
                                    animation: task.completed ? "none" : "pulse 2s infinite",
                                }}
                            ></div>
                        </div>

                        {/* Task card content stays the same... */}
                    </div>

                    {/* Fixed Add task button between timeline items */}
                    <div className="relative h-8 flex justify-center items-center my-4">
                        {/* Timeline line continues through the button area */}
                        <div
                            className="absolute left-1/2 w-1 h-full -translate-x-1/2 z-10"
                            style={{ background: `linear-gradient(to bottom, ${eventTheme.primaryColor}, ${eventTheme.secondaryColor})` }}
                        ></div>

                        <motion.div
                            className="relative z-30"
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button
                                size="sm"
                                variant="outline"
                                aria-label="Add task"
                                onClick={() => handleAddTask(index + 1)}
                                className="rounded-full h-8 w-8 p-0 bg-white shadow-lg hover:shadow-xl transition-all duration-200 border-2"
                                style={{
                                    borderColor: eventTheme.primaryColor,
                                    color: eventTheme.primaryColor,
                                    backgroundColor: "white",
                                }}
                            >
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
);

export default TimelineFix;