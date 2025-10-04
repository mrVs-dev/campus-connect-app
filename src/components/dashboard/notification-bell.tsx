
"use client";

import * as React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase/firebase';
import { saveFcmToken } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NotificationBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationStatus, setNotificationStatus] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!messaging || !user) {
      toast({
        title: 'Error',
        description: 'Firebase Messaging is not set up correctly.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          throw new Error("VAPID key is missing. Cannot request token.");
        }

        const token = await getToken(messaging, { vapidKey });
        
        if (token) {
          await saveFcmToken(user.uid, token);
          toast({
            title: 'Notifications Enabled',
            description: "You will now receive updates from the school.",
          });
        } else {
           toast({
            title: 'Could Not Get Token',
            description: "Failed to retrieve the notification token. Please try again.",
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Notifications Blocked',
          description: "You have denied notification permissions. You can enable them in your browser settings.",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error getting notification token:', error);
      toast({
        title: 'Notification Error',
        description: 'An error occurred while enabling notifications.',
        variant: 'destructive',
      });
    }
  };
  
  if (notificationStatus === 'granted') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellRing className="h-5 w-5 text-green-600" />
        <span>Enabled</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Push Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleEnableNotifications}>
          Enable Notifications on this Device
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
