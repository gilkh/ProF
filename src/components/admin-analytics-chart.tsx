

'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PlatformAnalytics } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AdminAnalyticsChartProps {
  data: PlatformAnalytics['userSignups'] | undefined;
  isLoading: boolean;
  onTimePeriodChange: (period: 'monthly' | 'daily') => void;
  timePeriod: 'monthly' | 'daily';
}

export function AdminAnalyticsChart({ data, isLoading, onTimePeriodChange, timePeriod }: AdminAnalyticsChartProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New sign-ups over the last {timePeriod === 'monthly' ? '6 months' : '30 days'}.</CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <Button 
                    size="sm" 
                    variant={timePeriod === 'monthly' ? 'secondary' : 'ghost'}
                    onClick={() => onTimePeriodChange('monthly')}
                    className="h-8 px-4"
                >
                    Monthly
                </Button>
                <Button 
                    size="sm" 
                    variant={timePeriod === 'daily' ? 'secondary' : 'ghost'}
                    onClick={() => onTimePeriodChange('daily')}
                    className="h-8 px-4"
                >
                    Daily
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{
                                background: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                            }}
                        />
                        <Line type="monotone" dataKey="Clients" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                        <Line type="monotone" dataKey="Vendors" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
  );
}
