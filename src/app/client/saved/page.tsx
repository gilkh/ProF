
'use client';

import { useEffect, useState } from 'react';
import { OfferCard } from '@/components/offer-card';
import { ServiceCard } from '@/components/service-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceOrOffer } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useSavedItems } from '@/hooks/use-user-data';
import { useLanguage } from '@/hooks/use-language';

export default function SavedItemsPage() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const { translations } = useLanguage();
    const t = translations.clientSaved;

    const { data: savedItems = [], isLoading: isSavedLoading } = useSavedItems();

    // Derived loading state if critical, usually not blocking for 'saved items' but here we might prefer skeleton
    const pageIsLoading = isSavedLoading && !savedItems.length;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Link href="/client/profile">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <CardTitle>{t.title}</CardTitle>
                            <CardDescription>
                                {t.description}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {pageIsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
                        </div>
                    ) : savedItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {savedItems.map((item) =>
                                item.type === 'service' ? (
                                    <ServiceCard key={item.id} service={item} role="client" />
                                ) : (
                                    <OfferCard key={item.id} offer={item} role="client" />
                                )
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">{t.noItems}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

