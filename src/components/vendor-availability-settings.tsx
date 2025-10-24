'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { 
  getVendorAvailability, 
  updateServiceAvailability, 
  toggleServiceVisibility, 
  setDayAvailability, 
  addTimeSlot, 
  removeTimeSlot,
  getServicesAndOffers
} from '@/lib/services';
import type { 
  ServiceOrOffer, 
  VendorAvailability, 
  ServiceAvailability, 
  DayAvailability, 
  TimeSlot 
} from '@/lib/types';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon,
  Copy,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorAvailabilitySettingsProps {
  vendorId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorAvailabilitySettings({ vendorId, isOpen, onOpenChange }: VendorAvailabilitySettingsProps) {
  const [availability, setAvailability] = useState<VendorAvailability | null>(null);
  const [services, setServices] = useState<ServiceOrOffer[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [activeTab, setActiveTab] = useState('services');
  const [bulkTimeSlots, setBulkTimeSlots] = useState<TimeSlot[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: '', endTime: '', price: 0 });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && vendorId) {
      loadData();
    }
  }, [isOpen, vendorId]);

  const loadData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleServiceVisibility = async (serviceId: string, visible: boolean) => {
    try {
      await toggleServiceVisibility(vendorId, serviceId, visible);
      
      // Update local state
      setAvailability(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          services: {
            ...prev.services,
            [serviceId]: {
              ...prev.services[serviceId],
              visible
            }
          }
        };
      });
      
      toast.success(`Service visibility ${visible ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update service visibility');
    }
  };

  const handleAddBulkTimeSlot = () => {
    if (!newTimeSlot.startTime || !newTimeSlot.endTime) {
      toast.error('Please fill in start and end times');
      return;
    }

    const timeSlot: TimeSlot = {
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      price: newTimeSlot.price
    };

    setBulkTimeSlots(prev => [...prev, timeSlot]);
    setNewTimeSlot({ startTime: '', endTime: '', price: 0 });
  };

  const handleRemoveBulkTimeSlot = (index: number) => {
    setBulkTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyBulkTimeSlots = async () => {
    if (!selectedService || selectedDays.length === 0 || bulkTimeSlots.length === 0) {
      toast.error('Please select service, days, and add time slots');
      return;
    }

    setIsLoading(true);
    try {
      for (const day of selectedDays) {
        const dayAvailability: DayAvailability = {
          fullyBooked: false,
          timeSlots: bulkTimeSlots
        };
        await setDayAvailability(vendorId, selectedService, day, dayAvailability);
      }
      
      toast.success(`Applied time slots to ${selectedDays.length} days`);
      setBulkTimeSlots([]);
      setSelectedDays([]);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error applying bulk time slots:', error);
      toast.error('Failed to apply time slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyFromService = async (sourceServiceId: string) => {
    if (!selectedService || sourceServiceId === selectedService) return;

    try {
      const sourceAvailability = availability?.services[sourceServiceId];
      if (!sourceAvailability) {
        toast.error('Source service has no availability data');
        return;
      }

      await updateServiceAvailability(vendorId, selectedService, sourceAvailability);
      toast.success('Availability copied successfully');
      await loadData();
    } catch (error) {
      console.error('Error copying availability:', error);
      toast.error('Failed to copy availability');
    }
  };

  const generateWeekDays = () => {
    const today = new Date();
    const start = startOfWeek(today);
    const end = endOfWeek(addDays(today, 30)); // Next 30 days
    return eachDayOfInterval({ start, end });
  };

  const weekDays = generateWeekDays();
  const selectedServiceData = services.find(s => s.id === selectedService);
  const serviceAvailability = availability?.services[selectedService];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Availability Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Service Visibility</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Time Slots</TabsTrigger>
            <TabsTrigger value="copy">Copy Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="services" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Visibility Management</h3>
                <p className="text-sm text-muted-foreground">
                  Control which services are visible to clients for booking
                </p>
                
                {services.map(service => {
                  const serviceAvail = availability?.services[service.id];
                  const hasAvailability = serviceAvail && Object.keys(serviceAvail.dates || {}).length > 0;
                  
                  return (
                    <Card key={service.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{service.title}</h4>
                              <Badge variant="outline">{service.category}</Badge>
                              {hasAvailability && (
                                <Badge variant="secondary" className="text-xs">
                                  Has Availability
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description?.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Price: ${service.price}</span>
                              {service.location && <span>Location: {service.location}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`visibility-${service.id}`}
                              checked={serviceAvail?.visible ?? false}
                              onCheckedChange={(checked) => handleToggleServiceVisibility(service.id, checked)}
                              disabled={isLoading}
                            />
                            <Label htmlFor={`visibility-${service.id}`} className="flex items-center gap-1">
                              {serviceAvail?.visible ? (
                                <><Eye className="h-4 w-4 text-green-500" /> Visible</>
                              ) : (
                                <><EyeOff className="h-4 w-4 text-gray-400" /> Hidden</>
                              )}
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bulk Time Slot Management</h3>
                <p className="text-sm text-muted-foreground">
                  Apply the same time slots to multiple days at once
                </p>

                {/* Service Selection */}
                <div>
                  <Label htmlFor="bulk-service-select">Select Service</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="bulk-service-select">
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Slot Builder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Build Time Slots</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="bulk-start-time">Start Time</Label>
                        <Input
                          id="bulk-start-time"
                          type="time"
                          value={newTimeSlot.startTime}
                          onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bulk-end-time">End Time</Label>
                        <Input
                          id="bulk-end-time"
                          type="time"
                          value={newTimeSlot.endTime}
                          onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bulk-price">Price (optional)</Label>
                        <Input
                          id="bulk-price"
                          type="number"
                          placeholder="0"
                          value={newTimeSlot.price || ''}
                          onChange={(e) => setNewTimeSlot(prev => ({ ...prev, price: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddBulkTimeSlot} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>

                    {/* Time Slots List */}
                    {bulkTimeSlots.length > 0 && (
                      <div className="space-y-2">
                        <Label>Time Slots to Apply</Label>
                        {bulkTimeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                              {slot.price > 0 && <Badge variant="outline">${slot.price}</Badge>}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveBulkTimeSlot(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Day Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Select Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const isSelected = selectedDays.includes(dayStr);
                        
                        return (
                          <Button
                            key={dayStr}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-16 flex flex-col"
                            onClick={() => {
                              setSelectedDays(prev => 
                                isSelected 
                                  ? prev.filter(d => d !== dayStr)
                                  : [...prev, dayStr]
                              );
                            }}
                          >
                            <span className="text-xs">{format(day, 'EEE')}</span>
                            <span className="font-bold">{format(day, 'dd')}</span>
                            <span className="text-xs">{format(day, 'MMM')}</span>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedDays([])}
                      >
                        Clear All
                      </Button>
                      <Button
                        onClick={handleApplyBulkTimeSlots}
                        disabled={isLoading || selectedDays.length === 0 || bulkTimeSlots.length === 0}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Apply to {selectedDays.length} Days
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="copy" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Copy Availability Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Copy availability settings from one service to another
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target-service">Target Service (to update)</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger id="target-service">
                        <SelectValue placeholder="Choose target service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedService && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Copy From</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {services
                        .filter(service => service.id !== selectedService)
                        .map(service => {
                          const serviceAvail = availability?.services[service.id];
                          const hasAvailability = serviceAvail && Object.keys(serviceAvail.dates || {}).length > 0;
                          
                          return (
                            <div key={service.id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <h4 className="font-medium">{service.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {hasAvailability ? 
                                    `${Object.keys(serviceAvail.dates).length} days configured` : 
                                    'No availability set'
                                  }
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyFromService(service.id)}
                                disabled={!hasAvailability || isLoading}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}