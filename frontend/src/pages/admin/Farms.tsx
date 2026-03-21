import { useState } from 'react';
import { farms, getAnimalsByFarm, getUserById } from '@/data/mockData';
import { FarmTypeBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Search, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminFarms() {
  const [search, setSearch] = useState('');
  const filtered = farms.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">All Farms</h1>
        <p className="text-sm text-muted-foreground mt-1">{farms.length} farm{farms.length !== 1 ? 's' : ''} on the platform</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search farms..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No farms found" description="Adjust your search to find farms." />
      ) : (
        <div className="space-y-2">
          {filtered.map(f => {
            const farmer = getUserById(f.farmerId);
            const animalCount = getAnimalsByFarm(f.id).length;
            return (
              <div key={f.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{f.name}</p>
                      <FarmTypeBadge type={f.type} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{farmer?.name} · {f.city}, {f.country}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground space-y-0.5">
                    <p>{animalCount} animal{animalCount !== 1 ? 's' : ''}</p>
                    <p>{f.hectares} ha</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
