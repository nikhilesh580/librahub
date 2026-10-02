import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, X, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ReservationsPage({ userView = false }: { userView?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', userView],
    queryFn: async () => {
      if (userView) {
        const { data } = await api.get('/reservations/my');
        return data.data || [];
      }
      const { data } = await api.get('/reservations', { params: { limit: 50 } });
      return data.data || [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reservations/${id}`),
    onSuccess: () => { toast.success('Reservation cancelled'); queryClient.invalidateQueries({ queryKey: ['reservations'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reservations = data || [];

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">{userView ? 'My Reservations' : 'Reservations'}</h1><p className="page-description">{reservations.length} reservations</p></div>
      {isLoading ? Array.from({length:3}).map((_,i)=><div key={i} className="skeleton h-16 w-full rounded-lg" />) : reservations.length === 0 ? (
        <div className="empty-state"><CalendarClock className="w-16 h-16 text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No reservations</h3></div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res: any) => (
            <Card key={res.id} className="hover:shadow-sm transition-all">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{res.book?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {!userView && <>Member: {res.user?.name} • </>}
                    Queue: #{res.queuePosition} • Expires: {formatDate(res.expiryDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="status" status={res.status}>{res.status}</Badge>
                  {(res.status === 'PENDING' || res.status === 'READY') && (
                    <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(res.id)} disabled={cancelMutation.isPending}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
