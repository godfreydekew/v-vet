import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchFarms } from '@/lib/services/farms.service';
import { fetchLivestock } from '@/lib/services/livestock.service';
import { fetchVetRequests } from '@/lib/services/vetRequests.service';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle, Stethoscope, Loader2, ClipboardList } from 'lucide-react';

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sick: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  recovering: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  deceased: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function FarmerDashboard() {
  const { user } = useAuth();

  const farmsQuery = useQuery({
    queryKey: ['farms'],
    queryFn: () => fetchFarms({ limit: 100 }),
  });

  const livestockQuery = useQuery({
    queryKey: ['livestock'],
    queryFn: () => fetchLivestock({ limit: 500 }),
  });

  const farms = farmsQuery.data?.data ?? [];
  const allAnimals = livestockQuery.data?.data ?? [];

  const healthyCount = allAnimals.filter((a) => a.health_status === 'healthy').length;
  const sickCount = allAnimals.filter(
    (a) => a.health_status === 'sick' || a.health_status === 'recovering'
  ).length;
  const sickAnimals = allAnimals.filter(
    (a) => a.health_status === 'sick' || a.health_status === 'recovering'
  );

  const animalsByFarm = allAnimals.reduce<Record<string, number>>((acc, a) => {
    acc[a.farm_id] = (acc[a.farm_id] ?? 0) + 1;
    return acc;
  }, {});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.full_name ?? user?.email ?? '').split(' ')[0];

  const vetRequestsQuery = useQuery({
    queryKey: ['vet-requests'],
    queryFn: () => fetchVetRequests({ limit: 100 }),
  });

  const openRequests = (vetRequestsQuery.data?.data ?? []).filter(
    (r) => r.status !== 'completed' && r.status !== 'cancelled'
  );

  const isLoading = farmsQuery.isLoading || livestockQuery.isLoading;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your herd at a glance.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Animals', value: allAnimals.length, color: 'text-foreground' },
              { label: 'Healthy', value: healthyCount, color: 'text-green-600 dark:text-green-400' },
              { label: 'Sick / Recovering', value: sickCount, color: 'text-red-600 dark:text-red-400' },
              { label: 'My Farms', value: farms.length, color: 'text-foreground' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow duration-150"
              >
                <p className={`text-3xl font-bold ${s.color} tracking-tight`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* My Farms */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">My Farms</h2>
              <Link
                to="/farms"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline transition-colors"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>
            {farms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No farms yet.{' '}
                <Link to="/farms" className="text-primary hover:underline">
                  Add one
                </Link>
                .
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
                {farms.map((farm) => (
                  <Link
                    key={farm.id}
                    to={`/farms/${farm.id}`}
                    className="min-w-[210px] max-w-[210px] shrink-0"
                  >
                    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-150 h-full">
                      <h3 className="font-semibold text-sm text-foreground truncate">{farm.name}</h3>
                      <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                        {farm.farm_type}
                      </span>
                      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                        <span>{animalsByFarm[farm.id] ?? 0} animals</span>
                        {farm.size_hectares != null && <span>{farm.size_hectares} ha</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Animals Needing Attention */}
          {sickAnimals.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" /> Animals Needing Attention
              </h2>
              <div className="space-y-2">
                {sickAnimals.slice(0, 5).map((animal) => (
                  <Link
                    key={animal.id}
                    to={`/animals/${animal.id}`}
                    className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {animal.name ?? 'Unnamed'}{' '}
                          {animal.tag_number && (
                            <span className="text-muted-foreground">({animal.tag_number})</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {animal.species}
                          {animal.breed ? ` · ${animal.breed}` : ''}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${HEALTH_COLORS[animal.health_status]}`}
                      >
                        {animal.health_status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Open Vet Requests */}
          {openRequests.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ClipboardList size={18} className="text-primary" /> Open Vet Requests
                </h2>
                <Link to="/vet-requests" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline transition-colors">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-2">
                {openRequests.slice(0, 3).map((req) => (
                  <Link
                    key={req.id}
                    to={`/vet-requests/${req.id}`}
                    className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(req.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          req.urgency === 'emergency' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : req.urgency === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : req.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {req.urgency}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-accent text-foreground capitalize">
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {allAnimals.length === 0 && farms.length === 0 && (
            <EmptyState
              icon={Stethoscope}
              title="Nothing here yet"
              description="Add a farm and start tracking your livestock."
              actionLabel="Add Farm"
              onAction={() => window.location.assign('/farms')}
            />
          )}
        </>
      )}
    </div>
  );
}
