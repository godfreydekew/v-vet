import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFarmById, getAnimalsByFarm, type Species, type HealthStatus } from '@/data/mockData';
import { StatusBadge, FarmTypeBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, ArrowLeft, Bug as Cow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const speciesFilters: (Species | 'All')[] = ['All', 'Cattle', 'Sheep', 'Goat', 'Poultry'];
const healthFilters: (HealthStatus | 'All')[] = ['All', 'Healthy', 'Sick', 'Recovering', 'Deceased'];

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const farm = getFarmById(id || '');
  const allAnimals = getAnimalsByFarm(id || '');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<Species | 'All'>('All');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | 'All'>('All');

  if (!farm) return <div className="p-8 text-center text-muted-foreground animate-fade-in">Farm not found</div>;

  const filtered = allAnimals.filter(a => {
    if (speciesFilter !== 'All' && a.species !== speciesFilter) return false;
    if (healthFilter !== 'All' && a.healthStatus !== healthFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tagNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link to="/farms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Farms
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{farm.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{farm.address}, {farm.city}, {farm.country}</p>
        </div>
        <FarmTypeBadge type={farm.type} />
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search animals..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {speciesFilters.map(s => (
            <button key={s} onClick={() => setSpeciesFilter(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${speciesFilter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {healthFilters.map(h => (
            <button key={h} onClick={() => setHealthFilter(h)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${healthFilter === h ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground'}`}>
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Animal list */}
      {filtered.length === 0 ? (
        <EmptyState icon={Cow} title="No animals found" description="Add your first animal or adjust your filters." actionLabel="Add Animal" onAction={() => {}} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(animal => (
            <Link key={animal.id} to={`/animals/${animal.id}`} className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150 block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{animal.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{animal.tagNumber} · {animal.species} · {animal.breed}</p>
                  <p className="text-xs text-muted-foreground">{animal.gender} · {animal.weight}kg</p>
                </div>
                <StatusBadge status={animal.healthStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
