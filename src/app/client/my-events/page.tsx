'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Users, QrCode, Camera, ArrowRight, Sparkles, Calendar, Gift, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyEventsPage() {
  const router = useRouter();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto space-y-8 px-2">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 py-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2 animate-fade-in-up">
            <Sparkles className="w-3 h-3" />
            <span>The Ultimate Event Experience</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-primary animate-gradient-x pb-2">
            My Events Hub
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Manage your masterpiece and create unforgettable moments for your guests.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-8"
        >
          {/* Planner Card - The Foundation */}
          <motion.div variants={item} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative liquid-glass-solid p-1 rounded-2xl h-full">
              <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-6 h-full overflow-hidden group-hover:bg-card/80 transition-colors duration-300">

                {/* Background Icon */}
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 rotate-12">
                  <PenTool className="w-40 h-40" />
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-2xl border border-primary/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <PenTool className="w-8 h-8 text-primary" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      Plan Your Event
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Core</span>
                    </h3>
                    <p className="text-muted-foreground">
                      Master your timeline, control your budget, and manage vendor bookings in one place.
                    </p>
                  </div>

                  <Button
                    onClick={() => router.push('/client/event-planner')}
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 shadow-lg hover:shadow-primary/25 transition-all duration-300"
                  >
                    Open Planner <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Guest Experience Card - The Viral Loop */}
          <motion.div variants={item} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500 animate-pulse-slow" />
            <div className="relative liquid-glass p-1 rounded-2xl h-full">
              <div className="relative bg-card/40 backdrop-blur-md rounded-xl p-6 h-full overflow-hidden group-hover:bg-card/60 transition-colors duration-300">

                {/* Floating Particles */}
                <div className="absolute top-10 right-10 w-2 h-2 bg-purple-500 rounded-full animate-ping opacity-75" />
                <div className="absolute bottom-10 left-20 w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce opacity-75 delay-300" />

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30 shadow-inner">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        Guest Experience
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Viral
                        </span>
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Create a buzz with digital invites and live interactions.
                      </p>
                    </div>
                  </div>

                  {/* Feature Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="group/item flex flex-col items-center justify-center p-4 rounded-xl bg-white/50 border border-purple-100 hover:border-purple-300 hover:bg-white/80 transition-all cursor-pointer hover:-translate-y-1 shadow-sm">
                      <div className="p-2 bg-purple-100 rounded-full mb-2 group-hover/item:scale-110 transition-transform">
                        <QrCode className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-xs font-semibold text-purple-900">QR Entry</span>
                      <span className="text-[10px] text-muted-foreground">Seamless Check-in</span>
                    </div>

                    <div className="group/item flex flex-col items-center justify-center p-4 rounded-xl bg-white/50 border border-pink-100 hover:border-pink-300 hover:bg-white/80 transition-all cursor-pointer hover:-translate-y-1 shadow-sm">
                      <div className="p-2 bg-pink-100 rounded-full mb-2 group-hover/item:scale-110 transition-transform">
                        <Camera className="w-5 h-5 text-pink-600" />
                      </div>
                      <span className="text-xs font-semibold text-pink-900">Live Feed</span>
                      <span className="text-[10px] text-muted-foreground">Real-time Photos</span>
                    </div>

                    <div className="group/item flex flex-col items-center justify-center p-4 rounded-xl bg-white/50 border border-blue-100 hover:border-blue-300 hover:bg-white/80 transition-all cursor-pointer hover:-translate-y-1 shadow-sm col-span-2 md:col-span-1">
                      <div className="p-2 bg-blue-100 rounded-full mb-2 group-hover/item:scale-110 transition-transform">
                        <Gift className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-xs font-semibold text-blue-900">Digital Gifting</span>
                      <span className="text-[10px] text-muted-foreground">Cash Registry</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
                  >
                    Manage Guest Experience <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
