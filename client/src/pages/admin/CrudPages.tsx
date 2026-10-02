import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface CrudPageProps {
  title: string;
  endpoint: string;
  fields: { key: string; label: string; type?: string; required?: boolean }[];
  dataKey: string;
}

export default function CrudPage({ title, endpoint, fields, dataKey }: CrudPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: [dataKey, search],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      const { data } = await api.get(endpoint, { params });
      return data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(endpoint, data),
    onSuccess: () => { toast.success(`${title.slice(0,-1)} created`); setCreateOpen(false); setFormData({}); queryClient.invalidateQueries({ queryKey: [dataKey] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`${endpoint}/${id}`, data),
    onSuccess: () => { toast.success('Updated'); setEditItem(null); queryClient.invalidateQueries({ queryKey: [dataKey] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: [dataKey] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const items = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">{title}</h1><p className="page-description">{items.length} {title.toLowerCase()}</p></div>
        <Button onClick={() => { setFormData({}); setCreateOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add</Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
      </CardContent></Card>
      <div className="table-container"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50">
          {fields.map(f => <th key={f.key} className="text-left py-3 px-4 font-medium">{f.label}</th>)}
          <th className="text-left py-3 px-4 font-medium">Books</th>
          <th className="text-right py-3 px-4 font-medium">Actions</th>
        </tr></thead>
        <tbody>
          {isLoading ? <tr><td colSpan={fields.length+2} className="py-3 px-4"><div className="skeleton h-4 w-full" /></td></tr> : items.length === 0 ? <tr><td colSpan={fields.length+2} className="text-center py-8 text-muted-foreground">No {title.toLowerCase()} found</td></tr> : items.map((item: any) => (
            <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
              {fields.map(f => <td key={f.key} className="py-3 px-4">{item[f.key] || '-'}</td>)}
              <td className="py-3 px-4">{item._count?.books ?? 0}</td>
              <td className="py-3 px-4 text-right space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setFormData(item); setEditItem(item); }}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(item.id) }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editItem} onOpenChange={() => { setCreateOpen(false); setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} {title.slice(0,-1)}</DialogTitle><DialogDescription>Fill in the details below</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.key}><Label>{f.label}</Label><Input type={f.type || 'text'} value={formData[f.key] || ''} onChange={(e) => setFormData({...formData, [f.key]: e.target.value})} /></div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={() => editItem ? updateMutation.mutate({...formData, id: editItem.id}) : createMutation.mutate(formData)} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Exported pages using the generic CrudPage
export function AuthorsPage() {
  return <CrudPage title="Authors" endpoint="/authors" dataKey="authors" fields={[{key:'name',label:'Name',required:true},{key:'biography',label:'Biography'}]} />;
}
export function CategoriesPage() {
  return <CrudPage title="Categories" endpoint="/categories" dataKey="categories" fields={[{key:'name',label:'Name',required:true},{key:'description',label:'Description'}]} />;
}
export function PublishersPage() {
  return <CrudPage title="Publishers" endpoint="/publishers" dataKey="publishers" fields={[{key:'name',label:'Name',required:true},{key:'email',label:'Email',type:'email'},{key:'phone',label:'Phone'},{key:'address',label:'Address'}]} />;
}
