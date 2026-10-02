import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Book } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, BookOpen, User, Building, Tag, Calendar, Globe, Hash, MapPin, Edit, Trash2, BookMarked, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data } = await api.get(`/books/${id}`);
      return data.data as Book;
    },
    enabled: !!id,
  });

  const reserveMutation = useMutation({
    mutationFn: () => api.post('/reservations', { bookId: id }),
    onSuccess: () => {
      toast.success('Book reserved successfully!');
      queryClient.invalidateQueries({ queryKey: ['book', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="empty-state">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Book not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Cover */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
              {book.coverImage ? (
                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <BookOpen className="w-20 h-20 text-primary/20 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{book.isbn}</p>
                </div>
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Badge variant={book.availableCopies > 0 ? 'success' : 'destructive'}>
                  {book.availableCopies} of {book.totalCopies} Available
                </Badge>
              </div>
              {user?.role === 'MEMBER' && book.availableCopies === 0 && (
                <Button className="w-full" onClick={() => reserveMutation.mutate()} disabled={reserveMutation.isPending}>
                  {reserveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookMarked className="w-4 h-4 mr-2" />}
                  Reserve This Book
                </Button>
              )}
              {isStaff && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`edit`)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Book Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{book.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {book.description && <p className="text-muted-foreground">{book.description}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={Hash} label="ISBN" value={book.isbn} />
                <InfoItem icon={User} label="Author(s)" value={book.authors?.map(a => a.name).join(', ') || 'Unknown'} />
                <InfoItem icon={Tag} label="Category" value={book.category?.name || 'Uncategorized'} />
                <InfoItem icon={Building} label="Publisher" value={book.publisher?.name || 'Unknown'} />
                <InfoItem icon={Calendar} label="Published Year" value={book.publishedYear?.toString() || 'N/A'} />
                <InfoItem icon={Globe} label="Language" value={book.language} />
              </div>
            </CardContent>
          </Card>

          {/* Copies Table */}
          {isStaff && book.copies && book.copies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Physical Copies ({book.copies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">Accession #</th>
                        <th className="text-left py-2 px-3 font-medium">Status</th>
                        <th className="text-left py-2 px-3 font-medium">Condition</th>
                        <th className="text-left py-2 px-3 font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {book.copies.map((copy) => (
                        <tr key={copy.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-3 font-mono text-xs">{copy.accessionNumber}</td>
                          <td className="py-2 px-3"><Badge variant="status" status={copy.status}>{copy.status}</Badge></td>
                          <td className="py-2 px-3"><Badge variant="outline">{copy.condition}</Badge></td>
                          <td className="py-2 px-3 text-muted-foreground">{copy.shelfLocation || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
