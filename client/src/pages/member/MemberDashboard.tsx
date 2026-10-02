import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { MemberDashboard as MemberDashboardType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Clock, AlertTriangle, DollarSign, Bell, RefreshCw, Loader2 } from 'lucide-react';
import { formatDate, getDaysRemaining } from '@/utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function MemberDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['member-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/member');
      return data.data as MemberDashboardType;
    },
    refetchInterval: 30000,
  });

  const renewMutation = useMutation({
    mutationFn: (transactionId: string) => api.post('/transactions/renew', { transactionId }),
    onSuccess: () => {
      toast.success('Book renewed successfully!');
      queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="page-title">Dashboard</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="stat-card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-description">Here's your library activity overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Currently Borrowed</p><p className="text-2xl font-bold mt-1">{data?.currentlyBorrowed?.length || 0}</p></div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Pending Reservations</p><p className="text-2xl font-bold mt-1">{data?.reservations?.length || 0}</p></div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Outstanding Fines</p><p className="text-2xl font-bold mt-1">${(data?.totalPendingFines || 0).toFixed(2)}</p></div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Borrowed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Currently Borrowed</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.currentlyBorrowed || data.currentlyBorrowed.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No books currently borrowed</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/books')}>Browse Books</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.currentlyBorrowed.map((tx) => {
                  const days = tx.daysRemaining;
                  const isOverdue = days < 0;
                  return (
                    <div key={tx.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tx.bookCopy?.book?.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Due: {formatDate(tx.dueDate)}
                          </p>
                          <div className="mt-1">
                            {isOverdue ? (
                              <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />{Math.abs(days)} days overdue</Badge>
                            ) : days <= 3 ? (
                              <Badge variant="warning" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />{days} days left</Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px]">{days} days remaining</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => renewMutation.mutate(tx.id)}
                          disabled={renewMutation.isPending || isOverdue}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Renew
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.notifications || data.notifications.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
                {data.notifications.map((notif) => (
                  <div key={notif.id} className={`p-3 rounded-lg border text-sm ${notif.isRead ? 'opacity-60' : 'bg-primary/5 border-primary/20'}`}>
                    <p className="font-medium text-xs">{notif.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card>
          <CardHeader><CardTitle>My Reservations</CardTitle></CardHeader>
          <CardContent>
            {(!data?.reservations || data.reservations.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active reservations</p>
            ) : (
              <div className="space-y-2">
                {data.reservations.map((res) => (
                  <div key={res.id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{res.book?.title}</p>
                      <p className="text-xs text-muted-foreground">Queue position: #{res.queuePosition}</p>
                    </div>
                    <Badge variant="status" status={res.status}>{res.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader><CardTitle>Recommended for You</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(data?.recommendations || []).slice(0, 4).map((book) => (
                <div
                  key={book.id}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 hover:shadow-sm transition-all"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <div className="w-full h-20 rounded-md bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-2">
                    <BookOpen className="w-6 h-6 text-primary/30" />
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{book.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{book.authors?.map((a: any) => a.name).join(', ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
