import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, DollarSign, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function FinesPage({ userView = false }: { userView?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['fines', page, statusFilter, userView],
    queryFn: async () => {
      if (userView) {
        const { data } = await api.get('/fines/my');
        return { data: data.data.fines, meta: { total: data.data.fines.length, totalPages: 1 }, summary: data.data.summary };
      }
      const params: any = { page, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await api.get('/fines', { params });
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fines/${id}/pay`, {}),
    onSuccess: () => { toast.success('Fine paid'); queryClient.invalidateQueries({ queryKey: ['fines'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const waiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fines/${id}/waive`, {}),
    onSuccess: () => { toast.success('Fine waived'); queryClient.invalidateQueries({ queryKey: ['fines'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const fines = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{userView ? 'My Fines' : 'Fine Management'}</h1>
        <p className="page-description">{meta.total} fines total</p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card"><p className="text-sm text-muted-foreground">Total Fines</p><p className="text-xl font-bold">${data.summary.totalFines?.toFixed(2)}</p></div>
          <div className="stat-card"><p className="text-sm text-muted-foreground">Paid</p><p className="text-xl font-bold text-green-600">${data.summary.paidFines?.toFixed(2)}</p></div>
          <div className="stat-card"><p className="text-sm text-muted-foreground">Pending</p><p className="text-xl font-bold text-red-600">${data.summary.pendingFines?.toFixed(2)}</p></div>
          <div className="stat-card"><p className="text-sm text-muted-foreground">Waived</p><p className="text-xl font-bold text-blue-600">${data.summary.waivedFines?.toFixed(2)}</p></div>
        </div>
      )}

      {!userView && (
        <Card><CardContent className="p-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="PAID">Paid</SelectItem><SelectItem value="WAIVED">Waived</SelectItem></SelectContent>
          </Select>
        </CardContent></Card>
      )}

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              {!userView && <th className="text-left py-3 px-4 font-medium">Member</th>}
              <th className="text-left py-3 px-4 font-medium">Book</th>
              <th className="text-left py-3 px-4 font-medium">Amount</th>
              <th className="text-left py-3 px-4 font-medium">Reason</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Date</th>
              {(isAdmin || !userView) && <th className="text-right py-3 px-4 font-medium">Actions</th>}
            </tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b"><td colSpan={7} className="py-3 px-4"><div className="skeleton h-4 w-full" /></td></tr>
              )) : fines.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No fines found</td></tr>
              ) : fines.map((fine: any) => (
                <tr key={fine.id} className="border-b hover:bg-muted/30 transition-colors">
                  {!userView && <td className="py-3 px-4">{fine.user?.name || '-'}</td>}
                  <td className="py-3 px-4">{fine.transaction?.bookCopy?.book?.title || '-'}</td>
                  <td className="py-3 px-4 font-medium">${fine.amount.toFixed(2)}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{fine.reason}</Badge></td>
                  <td className="py-3 px-4"><Badge variant="status" status={fine.status}>{fine.status}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(fine.createdAt)}</td>
                  {(isAdmin || !userView) && (
                    <td className="py-3 px-4 text-right space-x-1">
                      {fine.status === 'PENDING' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => payMutation.mutate(fine.id)} disabled={payMutation.isPending}>Pay</Button>
                          {isAdmin && <Button variant="ghost" size="sm" onClick={() => waiveMutation.mutate(fine.id)} disabled={waiveMutation.isPending}>Waive</Button>}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
