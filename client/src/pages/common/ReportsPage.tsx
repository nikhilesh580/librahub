import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download } from 'lucide-react';

export default function ReportsPage() {
  const { data: overdueData } = useQuery({
    queryKey: ['report-overdue'],
    queryFn: async () => { const { data } = await api.get('/reports/overdue'); return data.data || []; },
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => { const { data } = await api.get('/reports/inventory'); return data.data; },
  });

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Reports</h1><p className="page-description">Library analytics and reports</p></div>

      {/* Overdue Report */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-red-500" />Overdue Books ({overdueData?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {(!overdueData || overdueData.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">No overdue books 🎉</p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 px-3">Book</th><th className="text-left py-2 px-3">Member</th><th className="text-left py-2 px-3">Due Date</th><th className="text-left py-2 px-3">Overdue Days</th></tr></thead>
              <tbody>{overdueData.map((tx: any) => (
                <tr key={tx.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-3">{tx.bookCopy?.book?.title}</td>
                  <td className="py-2 px-3">{tx.user?.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{new Date(tx.dueDate).toLocaleDateString()}</td>
                  <td className="py-2 px-3"><Badge variant="destructive">{tx.overdueDays} days</Badge></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <Card>
        <CardHeader><CardTitle>Inventory Summary</CardTitle></CardHeader>
        <CardContent>
          {inventoryData?.copiesByStatus ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {inventoryData.copiesByStatus.map((s: any) => (
                <div key={s.status} className="p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold">{s._count}</p>
                  <Badge variant="status" status={s.status} className="mt-1">{s.status}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
