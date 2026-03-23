import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFarms } from '@/lib/services/farms.service';
import { fetchLivestock } from '@/lib/services/livestock.service';
import { fetchUsers } from '@/lib/services/users.service';
import EmptyState from '@/components/EmptyState';
import { Search, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

export default function AdminFarms() {
  const [search, setSearch] = useState('');

  const farmsQuery = useQuery({
    queryKey: ['admin-farms'],
    queryFn: () => fetchFarms({ limit: 500 }),
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchUsers({ limit: 500 }),
  });

  const livestockQuery = useQuery({
    queryKey: ['admin-livestock'],
    queryFn: () => fetchLivestock({ limit: 500 }),
  });

  const farms = farmsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const livestock = livestockQuery.data?.data ?? [];

  const farmerMap = Object.fromEntries(users.map((u) => [u.id, u.full_name ?? u.email]));
  const animalsByFarm = livestock.reduce<Record<string, number>>((acc, a) => {
    acc[a.farm_id] = (acc[a.farm_id] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = farms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = farmsQuery.isLoading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">All Farms</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? 'Loading…' : `${farms.length} farm${farms.length !== 1 ? 's' : ''} on the platform`}
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search farms..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No farms found" description="Adjust your search to find farms." />
      ) : (
        <div className="space-y-2">
          {filtered.map((farm) => {
            const animalCount = animalsByFarm[farm.id] ?? 0;
            const farmerName = farmerMap[farm.farmer_id];
            return (
              <Link
                key={farm.id}
                to={`/farms/${farm.id}`}
                className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{farm.name}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground capitalize">
                        {farm.farm_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {farmerName ? `${farmerName} · ` : ''}
                      {[farm.city, farm.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground space-y-0.5">
                    <p>{animalCount} animal{animalCount !== 1 ? 's' : ''}</p>
                    {farm.size_hectares != null && <p>{farm.size_hectares} ha</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
