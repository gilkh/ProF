
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState } from 'react';
import type { Booking } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';

// Dynamically import the Calendar component to reduce initial bundle size
const Calendar = dynamic(() => import('@/components/ui/calendar').then(mod => mod.Calendar), {
    loading: () => <Skeleton className="h-[250px] w-[280px]" />,
    ssr: false // This component uses client-side state, so we disable SSR
});

interface CalendarViewProps {
  bookings: Booking[];
  isLoading: boolean;
}

export function CalendarView({ bookings, isLoading }: CalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const upcomingBookings = bookings
    .filter(b => b.date >= new Date())
    .sort((a,b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Calendar</CardTitle>
            <CardDescription>View all your scheduled appointments.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? <Skeleton className="h-[250px] w-[280px]" /> : (
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{ booked: bookings.map(b => b.date) }}
                    modifiersStyles={{
                        booked: { 
                        border: '2px solid hsl(var(--primary))',
                        borderRadius: 'var(--radius)',
                        }
                    }}
                />
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your next scheduled events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : upcomingBookings.length > 0 ? upcomingBookings.map(booking => (
                <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="text-center w-16 flex-shrink-0">
                        <p className="font-bold text-lg text-primary">{format(booking.date, 'dd')}</p>
                        <p className="text-xs text-muted-foreground uppercase">{format(booking.date, 'MMM')}</p>
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold">{booking.title}</p>
                        <p className="text-sm text-muted-foreground">With: {booking.with}</p>
                    </div>
                     <Badge variant="outline">{booking.time}</Badge>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No upcoming bookings.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
