
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState } from 'react';
import type { Booking } from '@/lib/types';
import { Badge } from './ui/badge';
import { CalendarClock, User } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'appointments' | 'bookings'>('all');

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isAppointment = (b: Booking) => {
    const title = (b.title || '').toLowerCase();
    const looksLikeMeeting = title.includes('meeting') || title.includes('call');
    return b.category === 'appointment' || looksLikeMeeting;
  };

  const filteredBookings = bookings.filter(b => {
    const appointment = isAppointment(b);
    if (viewMode === 'appointments') return appointment;
    if (viewMode === 'bookings') return !appointment; // treat undefined as booking for legacy items
    return true;
  });

  const upcomingBookings = filteredBookings
    .filter(b => b.date >= new Date())
    .sort((a,b) => a.date.getTime() - b.date.getTime());

  const selectedDateBookings = date
    ? filteredBookings.filter(b => isSameDay(b.date, date))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Calendar</CardTitle>
            <CardDescription>
              View your schedule. Toggle between appointments, bookings, or both. Select a date to see details {isMobile ? 'in a dialog.' : 'in the side panel.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? <Skeleton className="h-[250px] w-[280px]" /> : (
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      if (d && isMobile) setDetailsOpen(true);
                    }}
                    className="rounded-md border"
                    modifiers={{
                      'has-bookings': (d) => filteredBookings.some(b => isSameDay(b.date, d)),
                    }}
                    modifiersClassNames={{
                      'has-bookings': 'day-has-bookings'
                    }}
                />
            )}
          </CardContent>
          <CardContent>
            <div className="flex gap-2">
              <Button variant={viewMode === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('all')}>All</Button>
              <Button variant={viewMode === 'appointments' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('appointments')}>Appointments</Button>
              <Button variant={viewMode === 'bookings' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('bookings')}>Bookings</Button>
            </div>
          </CardContent>
          {/* Inline details within the same calendar card */}
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Date</p>
                  <h3 className="text-base font-semibold">{date ? format(date, 'MMM dd, yyyy') : 'Select a Date'}</h3>
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : selectedDateBookings.length > 0 ? selectedDateBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="font-bold text-lg text-primary">{format(booking.date, 'dd')}</p>
                      <p className="text-xs text-muted-foreground uppercase">{format(booking.date, 'MMM')}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {booking.with}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> {booking.time}
                    </Badge>
                    <Badge variant="secondary">{isAppointment(booking) ? 'Meeting' : 'Booking'}</Badge>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No bookings for this day.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{date ? format(date, 'MMM dd, yyyy') : 'Select a Date'}</CardTitle>
            <CardDescription>Bookings and appointments for the selected day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : selectedDateBookings.length > 0 ? selectedDateBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="font-bold text-lg text-primary">{format(booking.date, 'dd')}</p>
                      <p className="text-xs text-muted-foreground uppercase">{format(booking.date, 'MMM')}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {booking.with}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> {booking.time}
                    </Badge>
                    <Badge variant="secondary">{isAppointment(booking) ? 'Meeting' : 'Booking'}</Badge>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No bookings for this day.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings & Appointments</CardTitle>
            <CardDescription>Your next scheduled events grouped by type.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Appointments</h4>
                    {upcomingBookings.filter(isAppointment).length > 0 ? upcomingBookings.filter(isAppointment).map(booking => (
                      <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-center w-16 flex-shrink-0">
                          <p className="font-bold text-lg text-primary">{format(booking.date, 'dd')}</p>
                          <p className="text-xs text-muted-foreground uppercase">{format(booking.date, 'MMM')}</p>
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold">{booking.title}</p>
                          <p className="text-sm text-muted-foreground">With: {booking.with}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{booking.time}</Badge>
                          <Badge variant="secondary">Meeting</Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No upcoming appointments.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Bookings</h4>
                    {upcomingBookings.filter(b => !isAppointment(b)).length > 0 ? upcomingBookings.filter(b => !isAppointment(b)).map(booking => (
                      <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-center w-16 flex-shrink-0">
                          <p className="font-bold text-lg text-primary">{format(booking.date, 'dd')}</p>
                          <p className="text-xs text-muted-foreground uppercase">{format(booking.date, 'MMM')}</p>
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold">{booking.title}</p>
                          <p className="text-sm text-muted-foreground">With: {booking.with}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{booking.time}</Badge>
                          <Badge variant="secondary">Booking</Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No upcoming bookings.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: open dialog with selected date details when a date is tapped */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{date ? format(date, 'MMM dd, yyyy') : 'Selected Date'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : selectedDateBookings.length > 0 ? selectedDateBookings.map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="font-bold text-lg text-primary">{format(booking.date, 'dd')}</p>
                    <p className="text-xs text-muted-foreground uppercase">{format(booking.date, 'MMM')}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{booking.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {booking.with}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" /> {booking.time}
                  </Badge>
                  <Badge variant="secondary">{isAppointment(booking) ? 'Meeting' : 'Booking'}</Badge>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-4">No bookings for this day.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
