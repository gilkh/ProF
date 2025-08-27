
import { MessagingPanel } from '@/components/messaging-panel';
import { Card, CardContent } from '@/components/ui/card';

export default function VendorMessagesPage() {
  return (
    <Card className="h-[calc(100vh-10rem)]">
        <CardContent className="p-0 h-full">
            <MessagingPanel />
        </CardContent>
    </Card>
  )
}
