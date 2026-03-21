import { useState } from 'react';
import { animals, getFarmById, getUserById, type Species, type HealthStatus } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Search, Bug as Cow } from 'lucide-react';
import { Input } from '@/components/ui/input';

const speciesFilters: (Species | 'All')[] = ['All', 'Cattle', 'Sheep', 'Goat', 'Poultry'];
const healthFilters: (HealthStatus | 'All')[] = ['All', 'Healthy', 'Sick', 'Recovering', 'Deceased'];

export default function AdminLivestock() {
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<Species | 'All'>('All');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | 'All'>('All');

  const filtered = animals.filter(a => {
    if (speciesFilter !== 'All' && a.species !== speciesFilter) return false;
    if (healthFilter !== 'All' && a.healthStatus !== healthFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tagNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">All Livestock</h1>
        <p className="text-sm text-muted-foreground mt-1">{animals.length} animal{animals.length !== 1 ? 's' : ''} across all farms</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search animals..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-2 flex-wrap">
        {speciesFilters.map(s => (
          <button key={s} onClick={() => setSpeciesFilter(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${speciesFilter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground'}`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {healthFilters.map(h => (
          <button key={h} onClick={() => setHealthFilter(h)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${healthFilter === h ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground'}`}>{h}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Cow} title="No animals found" description="Adjust your filters to find livestock." />
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const farm = getFarmById(a.farmId);
            const farmer = getUserById(a.farmerId);
            return (
              <div key={a.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{a.name} <span className="text-muted-foreground">({a.tagNumber})</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.species} · {a.breed} · {farm?.name} · {farmer?.name}</p>
                  </div>
                  <StatusBadge status={a.healthStatus} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
