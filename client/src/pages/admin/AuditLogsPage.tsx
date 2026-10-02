import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { formatDateTime } from '@/utils';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entity],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (entity !== 'all') params.entity = entity;
      const { data } = await api.get('/reports/audit-logs', { params });
      return data;
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Audit Logs</h1><p className="page-description">Track all system activities</p></div>
      <Card><CardContent className="p-4">
        <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="User">Users</SelectItem>
            <SelectItem value="Book">Books</SelectItem>
            <SelectItem value="BookCopy">Book Copies</SelectItem>
            <SelectItem value="BorrowTransaction">Transactions</SelectItem>
            <SelectItem value="Fine">Fines</SelectItem>
            <SelectItem value="LibrarySettings">Settings</SelectItem>
          </SelectContent>
        </Select>
      </CardContent></Card>
      <div className="space-y-2">
        {isLoading ? Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-14 w-full rounded-lg" />) : logs.length === 0 ? (
          <div className="empty-state"><ScrollText className="w-16 h-16 text-muted-foreground/30 mb-4" /><h3>No logs found</h3></div>
        ) : logs.map((log: any) => (
          <Card key={log.id}><CardContent className="p-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm"><span className="font-medium">{log.user?.name || 'System'}</span> <span className="text-muted-foreground">{log.action.toLowerCase().replace(/_/g, ' ')}</span> <Badge variant="outline" className="ml-1">{log.entity}</Badge></p>
              <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>
      {meta.totalPages > 1 && <div className="flex items-center justify-center gap-2"><Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4" /></Button><span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span><Button variant="outline" size="sm" disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4" /></Button></div>}
    </div>
  );
}
