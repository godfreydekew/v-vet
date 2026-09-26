import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/services/users.service';
import type { User } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/EmptyState';
import { Search, Users, Loader2 } from 'lucide-react';

export default function AdminFarmers() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', 'farmer'],
    queryFn: async () => {
      const res = await fetchUsers({ limit: 200 });
      return res.data.filter((u: User) => u.role === 'farmer');
    },
  });

  const farmers = data ?? [];
  const filtered = farmers.filter(
    (f: User) =>
      (f.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (f.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Farmers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? 'Loading…' : `${farmers.length} registered farmer${farmers.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search farmers…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <p className="text-center text-sm text-destructive py-10">Unable to load farmers. Please refresh and try again.</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No farmers found" description="Farmers appear here once they sign up through WhatsApp." />
      ) : (
        <div className="space-y-2">
          {filtered.map((f: User) => (
            <div key={f.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{f.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.email}{f.phone_number ? ` · ${f.phone_number}` : ''}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {f.address ?? ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
