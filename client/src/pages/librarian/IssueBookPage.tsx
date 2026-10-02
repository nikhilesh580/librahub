import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, BookMarked, Loader2, CheckCircle, User, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IssueBookPage() {
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedCopy, setSelectedCopy] = useState<any>(null);
  const [issued, setIssued] = useState(false);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['search-members', memberSearch],
    queryFn: async () => {
      if (!memberSearch || memberSearch.length < 2) return [];
      const { data } = await api.get('/members', { params: { search: memberSearch, limit: 5, role: 'MEMBER' } });
      return data.data || [];
    },
    enabled: memberSearch.length >= 2,
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['search-books-issue', bookSearch],
    queryFn: async () => {
      if (!bookSearch || bookSearch.length < 2) return [];
      const { data } = await api.get('/books', { params: { search: bookSearch, limit: 5, availability: 'available' } });
      return data.data || [];
    },
    enabled: bookSearch.length >= 2,
  });

  const issueMutation = useMutation({
    mutationFn: (data: { userId: string; bookCopyId: string }) => api.post('/transactions/issue', data),
    onSuccess: () => {
      setIssued(true);
      toast.success('Book issued successfully!');
      queryClient.invalidateQueries({ queryKey: ['librarian-dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleIssue = () => {
    if (!selectedMember || !selectedCopy) {
      toast.error('Please select a member and a book copy');
      return;
    }
    issueMutation.mutate({ userId: selectedMember.id, bookCopyId: selectedCopy.id });
  };

  const handleReset = () => {
    setSelectedMember(null);
    setSelectedCopy(null);
    setMemberSearch('');
    setBookSearch('');
    setIssued(false);
  };

  if (issued) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Book Issued Successfully!</h2>
            <p className="text-muted-foreground mb-6">The book has been issued to the member.</p>
            <Button onClick={handleReset}>Issue Another Book</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">Issue Book</h1>
        <p className="page-description">Issue a book to a library member</p>
      </div>

      {/* Step 1: Select Member */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Step 1: Select Member</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {selectedMember ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium">{selectedMember.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="status" status={selectedMember.status}>{selectedMember.status}</Badge>
                  <Badge variant="outline">Books: {selectedMember._count?.transactions || 0}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedMember(null); setMemberSearch(''); }}>Change</Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-10" />
              </div>
              {membersLoading && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              {members && members.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {members.map((m: any) => (
                    <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(''); }} className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                      <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                      <Badge variant="status" status={m.status}>{m.status}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Book */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Step 2: Select Book</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {selectedCopy ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div>
                <p className="font-medium">{selectedCopy.bookTitle}</p>
                <p className="text-sm text-muted-foreground">Copy: {selectedCopy.accessionNumber}</p>
                <p className="text-xs text-muted-foreground">Location: {selectedCopy.shelfLocation || 'N/A'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSelectedCopy(null); setBookSearch(''); }}>Change</Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by title, ISBN..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} className="pl-10" />
              </div>
              {booksLoading && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin" /></div>}
              {books && books.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {books.map((book: any) => (
                    <div key={book.id} className="p-3 rounded-lg border">
                      <p className="text-sm font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{book.authors?.map((a: any) => a.name).join(', ')}</p>
                      {book.copies?.filter((c: any) => c.status === 'AVAILABLE').length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {book.copies.filter((c: any) => c.status === 'AVAILABLE').map((copy: any) => (
                            <Button key={copy.id} variant="outline" size="sm" onClick={() => setSelectedCopy({ ...copy, bookTitle: book.title })}>
                              {copy.accessionNumber}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-red-500">Loading copies...</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Issue Button */}
      <Button className="w-full" size="lg" onClick={handleIssue} disabled={!selectedMember || !selectedCopy || issueMutation.isPending}>
        {issueMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Issuing...</> : <><BookMarked className="w-4 h-4 mr-2" />Issue Book</>}
      </Button>
    </div>
  );
}
