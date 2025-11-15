'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { eventTypes, type EventType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EventTypeSelectorProps {
  value: EventType[] | 'any';
  onChange: (eventTypes: EventType[] | 'any') => void;
  appendTypes?: EventType[];
  placeholder?: string;
  className?: string;
}

export function EventTypeSelector({
  value,
  onChange,
  appendTypes = [],
  placeholder = "Select event types...",
  className
}: EventTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fullList = Array.from(new Set([...(eventTypes as EventType[]), ...appendTypes]));
  const filteredEventTypes = fullList.filter(eventType =>
    eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAnySelected = value === 'any';
  const selectedArray = Array.isArray(value) ? value : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleEventType = (eventType: EventType) => {
    if (isAnySelected) {
      onChange([eventType]);
    } else {
      const newSelection = selectedArray.includes(eventType)
        ? selectedArray.filter(t => t !== eventType)
        : [...selectedArray, eventType];
      onChange(newSelection.length === 0 ? 'any' : newSelection);
    }
  };

  const handleSelectAny = () => {
    onChange('any');
  };

  const handleRemoveEventType = (eventType: EventType) => {
    if (!isAnySelected) {
      const newSelection = selectedArray.filter(t => t !== eventType);
      onChange(newSelection.length === 0 ? 'any' : newSelection);
    }
  };

  const getDisplayText = () => {
    if (isAnySelected) {
      return 'All Event Types';
    }
    if (selectedArray.length === 0) {
      return placeholder;
    }
    if (selectedArray.length === 1) {
      return selectedArray[0];
    }
    return `${selectedArray.length} event types selected`;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn(
          'truncate',
          (isAnySelected || selectedArray.length > 0) ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {getDisplayText()}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {/* Selected event types display */}
      {!isAnySelected && selectedArray.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedArray.map(eventType => (
            <Badge key={eventType} variant="secondary" className="text-xs">
              {eventType}
              <button
                type="button"
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                onClick={() => handleRemoveEventType(eventType)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search event types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {/* All Event Types option */}
              <div
                className={cn(
                  'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent',
                  isAnySelected && 'bg-accent'
                )}
                onClick={handleSelectAny}
              >
                <span className="font-medium text-primary">All Event Types</span>
                {isAnySelected && <Check className="h-4 w-4 text-primary" />}
              </div>
              
              <div className="border-t" />
              
              {/* Individual event types */}
              {filteredEventTypes.length > 0 ? (
                filteredEventTypes.map(eventType => {
                  const isSelected = selectedArray.includes(eventType);
                  return (
                    <div
                      key={eventType}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent',
                        isSelected && 'bg-accent'
                      )}
                      onClick={() => handleToggleEventType(eventType)}
                    >
                      <span>{eventType}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No event types found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
