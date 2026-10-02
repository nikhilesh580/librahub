import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: { limit: 50 } });
      return data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => { toast.success('All marked as read'); queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Notifications</h1><p className="page-description">{unreadCount} unread notifications</p></div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            <CheckCheck className="w-4 h-4 mr-2" />Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />) :
         notifications.length === 0 ? (
          <div className="empty-state"><Bell className="w-16 h-16 text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No notifications</h3></div>
        ) : notifications.map((notif: any) => (
          <Card key={notif.id} className={`transition-all ${notif.isRead ? 'opacity-60' : 'border-primary/30 bg-primary/5'}`}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{notif.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(notif.id)}>
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
