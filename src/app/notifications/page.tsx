
'use client';

import { NotificationsPanel } from "@/components/notifications-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>All your recent updates in one place.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <NotificationsPanel />
            </CardContent>
        </Card>
    );
}
