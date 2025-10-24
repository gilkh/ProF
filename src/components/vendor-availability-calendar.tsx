'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import dynamic from 'next/dynamic';
import { 
  getVendorAvailability, 
  updateServiceAvailability, 
  toggleServiceVisibility, 
  setDayAvailability, 
  addTimeSlot, 
  removeTimeSlot,
  subscribeToVendorAvailability,
  getServicesAndOffers
} from '@/lib/services';
import type { 
  Booking, 
  ServiceOrOffer, 
  VendorAvailability, 
  ServiceAvailability, 
  DayAvailability, 
  TimeSlot 
} from '@/lib/types';
import { Clock, Eye, EyeOff, Plus, Trash2, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

const Calendar = dynamic(() => import('@/components/ui/calendar').then(mod => mod.Calendar), {
  loading: () => <Skeleton className="h-[250px] w-[280px]" />,
  ssr: false
});

interface VendorAvailabilityCalendarProps {
  vendorId: string;
  bookings: Booking[];
  isLoading: boolean;
}

export function VendorAvailabilityCalendar({ vendorId, bookings, isLoading }: VendorAvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<VendorAvailability | null>(null);
  const [services, setServices] = useState<ServiceOrOffer[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDaySettingsOpen, setIsDaySettingsOpen] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: '', endTime: '', price: 0 });

  // Load services and availability
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, availabilityData] = await Promise.all([
          getServicesAndOffers(vendorId),
          getVendorAvailability(vendorId)
        ]);
        
        setServices(servicesData);
        setAvailability(availabilityData);
        
        if (servicesData.length > 0 && !selectedService) {
          setSelectedService(servicesData[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load availability data');
      }
    };

    loadData();
  }, [vendorId]);

  // Subscribe to real-time availability updates
  useEffect(() => {
    if (!vendorId) return;

    const unsubscribe = subscribeToVendorAvailability(vendorId, (updatedAvailability) => {
      setAvailability(updatedAvailability);
    });

    return unsubscribe;
  }, [vendorId]);

  const selectedServiceData = services.find(s => s.id === selectedService);
  const serviceAvailability = availability?.services[selectedService];
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const dayAvailability = serviceAvailability?.dates[selectedDateStr];

  const handleToggleServiceVisibility = async (serviceId: string, visible: boolean) => {
    try {
      await toggleServiceVisibility(vendorId, serviceId, visible);
      toast.success(`Service visibility ${visible ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update service visibility');
    }
  };

  const handleToggleFullyBooked = async () => {
    if (!selectedService || !selectedDate) return;

    try {
      const newDayAvailability: DayAvailability = {
        fullyBooked: !dayAvailability?.fullyBooked,
        timeSlots: dayAvailability?.timeSlots || []
      };

      await setDayAvailability(vendorId, selectedService, selectedDateStr, newDayAvailability);
      toast.success(`Day marked as ${newDayAvailability.fullyBooked ? 'fully booked' : 'available'}`);
    } catch (error) {
      console.error('Error updating day availability:', error);
      toast.error('Failed to update day availability');
    }
  };

  const handleAddTimeSlot = async () => {
    if (!selectedService || !selectedDate || !newTimeSlot.startTime || !newTimeSlot.endTime) return;

    try {
      const timeSlot: TimeSlot = {
        startTime: newTimeSlot.startTime,
        endTime: newTimeSlot.endTime,
        price: newTimeSlot.price
      };

      await addTimeSlot(vendorId, selectedService, selectedDateStr, timeSlot);
      setNewTimeSlot({ startTime: '', endTime: '', price: 0 });
      toast.success('Time slot added successfully');
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast.error('Failed to add time slot');
    }
  };

  const handleRemoveTimeSlot = async (timeSlot: TimeSlot) => {
    if (!selectedService || !selectedDate) return;

    try {
      await removeTimeSlot(vendorId, selectedService, selectedDateStr, timeSlot);
      toast.success('Time slot removed successfully');
    } catch (error) {
      console.error('Error removing time slot:', error);
      toast.error('Failed to remove time slot');
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(booking.date, date) && 
      (!selectedService || booking.serviceId === selectedService)
    );
  };

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = getBookingsForDate(date);
    const dayAvail = serviceAvailability?.dates[dateStr];
    
    if (dayAvail?.fullyBooked) return 'fully-booked';
    if (dayBookings.length > 0) return 'has-bookings';
    if (dayAvail?.timeSlots && dayAvail.timeSlots.length > 0) return 'available';
    return 'no-availability';
  };

  return (
    <div className="space-y-6">
      {/* Service Selection and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Availability Management
              </CardTitle>
              <CardDescription>
                Manage your service availability and time slots
              </CardDescription>
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Service Availability Settings</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4">
                    {services.map(service => {
                      const serviceAvail = availability?.services[service.id];
                      return (
                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{service.title}</h4>
                            <p className="text-sm text-muted-foreground">{service.category}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`visibility-${service.id}`}
                                checked={serviceAvail?.visible ?? false}
                                onCheckedChange={(checked) => handleToggleServiceVisibility(service.id, checked)}
                              />
                              <Label htmlFor={`visibility-${service.id}`} className="flex items-center gap-1">
                                {serviceAvail?.visible ? (
                                  <><Eye className="h-4 w-4" /> Visible</>
                                ) : (
                                  <><EyeOff className="h-4 w-4" /> Hidden</>
                                )}
                              </Label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="service-select">Select Service/Offer</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger id="service-select">
                  <SelectValue placeholder="Choose a service or offer" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <span>{service.title}</span>
                        {availability?.services[service.id]?.visible ? (
                          <Eye className="h-3 w-3 text-green-500" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar and Day Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Click on a date to manage availability for {selectedServiceData?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isLoading ? (
                <Skeleton className="h-[250px] w-[280px]" />
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    'fully-booked': (date) => getDayStatus(date) === 'fully-booked',
                    'has-bookings': (date) => getDayStatus(date) === 'has-bookings',
                    'available': (date) => getDayStatus(date) === 'available',
                  }}
                  modifiersStyles={{
                    'fully-booked': { 
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                    },
                    'has-bookings': { 
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                    },
                    'available': { 
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--secondary-foreground))',
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day Details and Management */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a Date'}
              </CardTitle>
              <CardDescription>
                Manage availability for this day
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDate && selectedService ? (
                <>
                  {/* Fully Booked Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fully-booked">Fully Booked</Label>
                    <Switch
                      id="fully-booked"
                      checked={dayAvailability?.fullyBooked ?? false}
                      onCheckedChange={handleToggleFullyBooked}
                    />
                  </div>

                  <Separator />

                  {/* Time Slots */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Time Slots</h4>
                      <Dialog open={isDaySettingsOpen} onOpenChange={setIsDaySettingsOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Slot
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Time Slot</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="start-time">Start Time</Label>
                                <Input
                                  id="start-time"
                                  type="time"
                                  value={newTimeSlot.startTime}
                                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="end-time">End Time</Label>
                                <Input
                                  id="end-time"
                                  type="time"
                                  value={newTimeSlot.endTime}
                                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="price">Price (optional)</Label>
                              <Input
                                id="price"
                                type="number"
                                placeholder="0"
                                value={newTimeSlot.price || ''}
                                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, price: Number(e.target.value) }))}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsDaySettingsOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddTimeSlot}>
                                Add Slot
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {dayAvailability?.timeSlots && dayAvailability.timeSlots.length > 0 ? (
                      <div className="space-y-2">
                        {dayAvailability.timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                              {slot.price && <span className="text-sm text-muted-foreground ml-2">${slot.price}</span>}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveTimeSlot(slot)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No time slots configured
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Existing Bookings */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Existing Bookings</h4>
                    {getBookingsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-2">
                        {getBookingsForDate(selectedDate).map(booking => (
                          <div key={booking.id} className="p-2 bg-muted rounded">
                            <div className="font-medium">{booking.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {booking.time} • {booking.with}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No bookings for this day
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Select a date and service to manage availability
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive"></div>
              <span>Fully Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span>Has Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary"></div>
              <span>Available Slots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-muted"></div>
              <span>No Availability Set</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}