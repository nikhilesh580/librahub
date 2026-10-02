import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Book } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BooksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 12;

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['books', debouncedSearch, page, availability, sortBy, sortOrder],
    queryFn: async () => {
      const params: any = { page, limit, sortBy, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (availability !== 'all') params.availability = availability;
      const { data } = await api.get('/books', { params });
      return data;
    },
  });

  const books: Book[] = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const basePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'LIBRARIAN' ? '/librarian' : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-description">{meta.total} books in the library</p>
        </div>
        {isStaff && (
          <Button onClick={() => navigate(`${basePath}/books/new`)}>
            <BookOpen className="w-4 h-4 mr-2" /> Add Book
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by title, author, ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={availability} onValueChange={(v) => { setAvailability(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => { const [s, o] = v.split('-'); setSortBy(s); setSortOrder(o as 'asc' | 'desc'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Newest</SelectItem>
                <SelectItem value="createdAt-asc">Oldest</SelectItem>
                <SelectItem value="publishedYear-desc">Year (New)</SelectItem>
                <SelectItem value="publishedYear-asc">Year (Old)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden"><div className="skeleton h-48 w-full" /><CardContent className="p-4"><div className="skeleton h-4 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></CardContent></Card>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No books found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book, i) => (
            <Card
              key={book.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => navigate(`${basePath}/books/${book.id}`)}
            >
              {/* Cover */}
              <div className="h-48 bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <BookOpen className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">{book.isbn}</p>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={book.availableCopies > 0 ? 'success' : 'destructive'} className="text-[10px]">
                    {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Unavailable'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{book.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{book.category?.name || 'Uncategorized'}</span>
                  {book.publishedYear && <span>{book.publishedYear}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
