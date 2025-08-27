
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';

interface AdminStatCardProps {
    title: string;
    value: number | undefined;
    icon: React.ElementType;
    isLoading: boolean;
}

export function AdminStatCard({ title, value, icon: Icon, isLoading }: AdminStatCardProps) {
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{value ?? 0}</div>}
        </CardContent>
    </Card>
  );
}
