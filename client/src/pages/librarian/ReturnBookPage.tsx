import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function ReturnBookPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [condition, setCondition] = useState('GOOD');
  const [notes, setNotes] = useState('');
  const [returnResult, setReturnResult] = useState<any>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['search-issued', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data } = await api.get('/transactions', { params: { search, status: 'ISSUED', limit: 10 } });
      return data.data || [];
    },
    enabled: search.length >= 2,
  });

  const returnMutation = useMutation({
    mutationFn: (data: { transactionId: string; condition?: string; notes?: string }) =>
      api.post('/transactions/return', data),
    onSuccess: (res) => {
      setReturnResult(res.data.data);
      toast.success('Book returned successfully!');
      queryClient.invalidateQueries({ queryKey: ['librarian-dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleReturn = () => {
    if (!selectedTx) return;
    returnMutation.mutate({
      transactionId: selectedTx.id,
      condition: condition !== 'GOOD' ? condition : undefined,
      notes: notes || undefined,
    });
  };

  const handleReset = () => {
    setSelectedTx(null);
    setSearch('');
    setCondition('GOOD');
    setNotes('');
    setReturnResult(null);
  };

  if (returnResult) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Book Returned Successfully!</h2>
            {returnResult.overdueDays > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm"><AlertTriangle className="w-4 h-4 inline mr-1" />Overdue by {returnResult.overdueDays} days</p>
                {returnResult.fine && <p className="text-sm font-bold">Fine: ${returnResult.fine.amount.toFixed(2)}</p>}
              </div>
            )}
            <Button onClick={handleReset}>Return Another Book</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">Return Book</h1>
        <p className="page-description">Process a book return</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Search Issued Books</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {selectedTx ? (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{selectedTx.bookCopy?.book?.title}</p>
                  <p className="text-sm text-muted-foreground">Member: {selectedTx.user?.name}</p>
                  <p className="text-sm text-muted-foreground">Copy: {selectedTx.bookCopy?.accessionNumber}</p>
                  <p className="text-sm text-muted-foreground">Issued: {formatDate(selectedTx.issueDate)} • Due: {formatDate(selectedTx.dueDate)}</p>
                  {new Date(selectedTx.dueDate) < new Date() && (
                    <Badge variant="destructive" className="mt-1"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)}>Change</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by member name, book title, or accession number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              {isLoading && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              {transactions && transactions.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {transactions.map((tx: any) => (
                    <button key={tx.id} onClick={() => setSelectedTx(tx)} className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                      <p className="text-sm font-medium">{tx.bookCopy?.book?.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.user?.name} • {tx.bookCopy?.accessionNumber} • Due: {formatDate(tx.dueDate)}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedTx && (
        <Card>
          <CardHeader><CardTitle>Return Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Book Condition</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="POOR">Poor</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input placeholder="Any notes about the return..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button className="w-full" size="lg" onClick={handleReturn} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><RotateCcw className="w-4 h-4 mr-2" />Process Return</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
