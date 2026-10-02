import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { formatDate } from '@/utils';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', search, status, page],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      const { data } = await api.get('/transactions', { params });
      return data;
    },
  });

  const txs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Transactions</h1><p className="page-description">{meta.total} transactions</p></div>
      <Card><CardContent className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="ISSUED">Issued</SelectItem><SelectItem value="RETURNED">Returned</SelectItem><SelectItem value="OVERDUE">Overdue</SelectItem></SelectContent>
        </Select>
      </CardContent></Card>
      <div className="table-container">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50"><th className="text-left py-3 px-4 font-medium">Book</th><th className="text-left py-3 px-4 font-medium">Member</th><th className="text-left py-3 px-4 font-medium">Copy</th><th className="text-left py-3 px-4 font-medium">Issued</th><th className="text-left py-3 px-4 font-medium">Due</th><th className="text-left py-3 px-4 font-medium">Returned</th><th className="text-left py-3 px-4 font-medium">Status</th></tr></thead>
          <tbody>{isLoading ? Array.from({length:5}).map((_,i)=><tr key={i} className="border-b"><td colSpan={7} className="py-3 px-4"><div className="skeleton h-4 w-full" /></td></tr>) : txs.length===0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No transactions found</td></tr> : txs.map((tx:any)=>(
            <tr key={tx.id} className="border-b hover:bg-muted/30"><td className="py-3 px-4 font-medium max-w-[200px] truncate">{tx.bookCopy?.book?.title}</td><td className="py-3 px-4">{tx.user?.name}</td><td className="py-3 px-4 font-mono text-xs">{tx.bookCopy?.accessionNumber}</td><td className="py-3 px-4 text-muted-foreground">{formatDate(tx.issueDate)}</td><td className="py-3 px-4 text-muted-foreground">{formatDate(tx.dueDate)}</td><td className="py-3 px-4 text-muted-foreground">{tx.returnDate ? formatDate(tx.returnDate) : '-'}</td><td className="py-3 px-4"><Badge variant="status" status={tx.status}>{tx.status}</Badge></td></tr>
          ))}</tbody>
        </table></div>
        {meta.totalPages > 1 && <div className="flex items-center justify-center gap-2 p-4 border-t"><Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="w-4 h-4" /></Button><span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span><Button variant="outline" size="sm" disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight className="w-4 h-4" /></Button></div>}
      </div>
    </div>
  );
}
