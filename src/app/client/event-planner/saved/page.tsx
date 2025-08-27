
'use client';

import { useEffect, useState } from 'react';
import type { SavedTimeline } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { FileCheck, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getSavedTimelines, deleteTimeline } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';


export default function SavedTimelinesPage() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [savedTimelines, setSavedTimelines] = useState<SavedTimeline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function fetchTimelines() {
            if (!userId) {
                if(!isAuthLoading) setIsLoading(false);
                return;
            }
            try {
                const timelines = await getSavedTimelines(userId);
                setSavedTimelines(timelines);
            } catch (error) {
                console.error("Could not load saved timelines from Firestore", error);
                toast({
                    title: "Error",
                    description: "Failed to load saved timelines.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchTimelines();
    }, [userId, isAuthLoading, toast]);

    const handleDeleteSavedTimeline = async (id: string) => {
        if (!userId) return;
        try {
            await deleteTimeline(userId, id);
            setSavedTimelines(prev => prev.filter(st => st.id !== id));
            toast({
                title: 'Timeline Deleted',
                description: 'The saved timeline has been removed.',
            });
        } catch (error) {
             console.error("Could not delete timeline from Firestore", error);
            toast({
                title: "Error",
                description: "Failed to delete the timeline.",
                variant: "destructive",
            });
        }
    }

    const handleLoadTimeline = (id: string) => {
        router.push(`/client/event-planner?timelineId=${id}`);
    }

    const pageIsLoading = isLoading || isAuthLoading;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Link href="/client/event-planner">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <CardTitle>My Saved Timelines</CardTitle>
                            <CardDescription>
                                View a previously saved event plan or delete ones you no longer need.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pageIsLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                            </div>
                        ) : savedTimelines.length > 0 ? (
                            <ul className="space-y-3">
                            {savedTimelines.sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).map(st => {
                                const savedProgress = st.tasks.length > 0 ? (st.tasks.filter(t => t.completed).length / st.tasks.length) * 100 : 0;
                                return (
                                    <li key={st.id} className="p-4 border rounded-lg flex items-center justify-between gap-4 group">
                                        <div className="flex-grow">
                                            <p className="font-semibold">{st.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Last updated: {format(new Date(st.lastModified), "PPP p")}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Progress value={savedProgress} className="h-2 w-32" />
                                                <span className="text-xs text-muted-foreground">{Math.round(savedProgress)}%</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <Button onClick={() => handleLoadTimeline(st.id)}>
                                                <FileCheck className="mr-2 h-4 w-4"/> View
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDeleteSavedTimeline(st.id)} className="text-destructive opacity-50 group-hover:opacity-100">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">You have no saved timelines yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
