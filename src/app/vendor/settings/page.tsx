
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { useAuth } from '@/hooks/use-auth';
import { KeyRound, Moon, Sun } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';


export default function VendorSettingsPage() {
  const { userId } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { language, setLanguage, translations } = useLanguage();
  const t = translations.settings;
  
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>{t.vendorAccountSettings.title}</CardTitle>
                <CardDescription>{t.vendorAccountSettings.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="owner-name">{t.vendorAccountSettings.ownerName}</Label>
                        <Input id="owner-name" defaultValue="Jane Smith" disabled/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">{t.vendorAccountSettings.loginEmail}</Label>
                        <Input id="email" type="email" defaultValue="jane.smith@timeless-snaps.com" disabled/>
                    </div>
                </div>
                {userId && (
                    <ChangePasswordDialog userId={userId}>
                        <Button variant="outline">
                            <KeyRound className="mr-2 h-4 w-4" />
                            {t.accountSettings.changePassword}
                        </Button>
                    </ChangePasswordDialog>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t.appearanceSettings.title}</CardTitle>
                <CardDescription>{t.appearanceSettings.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label>{t.appearanceSettings.theme.label}</Label>
                    <div className="flex gap-2">
                        <Button variant={theme === 'light' ? 'default' : 'outline'} className="w-full justify-start gap-2" onClick={() => setTheme('light')}>
                            <Sun className="h-5 w-5" />
                            {t.appearanceSettings.theme.light}
                        </Button>
                        <Button variant={theme === 'dark' ? 'default' : 'outline'} className="w-full justify-start gap-2" onClick={() => setTheme('dark')}>
                            <Moon className="h-5 w-5" />
                            {t.appearanceSettings.theme.dark}
                        </Button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="language">{t.appearanceSettings.language.label}</Label>
                     <Select value={language} onValueChange={(value: 'en' | 'fr' | 'ar') => setLanguage(value)}>
                        <SelectTrigger id="language">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t.notificationSettings.title}</CardTitle>
                <CardDescription>{t.notificationSettings.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                        <span>{t.notificationSettings.push.label}</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                            {t.vendorNotificationSettings.push.description}
                        </span>
                    </Label>
                    <Switch id="push-notifications" defaultChecked />
                </div>
                 <Separator />
                <div className="space-y-4">
                    <h3 className="text-md font-medium">{t.notificationSettings.email.label}</h3>
                    <div className="space-y-3">
                         <div className="flex items-center gap-3">
                            <Checkbox id="notify-messages" defaultChecked />
                            <Label htmlFor="notify-messages" className="font-normal">{t.vendorNotificationSettings.email.newMessages}</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="notify-quotes" defaultChecked />
                            <Label htmlFor="notify-quotes" className="font-normal">{t.vendorNotificationSettings.email.quoteRequests}</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox id="notify-bookings" defaultChecked />
                            <Label htmlFor="notify-bookings" className="font-normal">{t.vendorNotificationSettings.email.newBookings}</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">{t.dangerZone.title}</CardTitle>
                <CardDescription>{t.dangerZone.description}</CardDescription>
            </CardHeader>
            <CardContent>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive">{t.dangerZone.deactivateProfile}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.dangerZone.areYouSure}</AlertDialogTitle>
                            <AlertDialogDescription>
                               {t.dangerZone.deactivateDescription}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{translations.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toast({ title: translations.common.actionCancelled, description: "Profile deactivation is a placeholder."})}>{t.dangerZone.deactivateProfile}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    </div>
  )
}
