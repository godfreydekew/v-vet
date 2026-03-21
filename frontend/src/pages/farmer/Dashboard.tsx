import { useAuth } from '@/contexts/AuthContext';
import { animals, farms, vetRequests, healthObservations, activityEvents, getAnimalsByFarmer, getFarmsByFarmer, getRequestsByFarmer, getAnimalById } from '@/data/mockData';
import { StatusBadge, UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle, Building2, Stethoscope } from 'lucide-react';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const myFarms = getFarmsByFarmer(user?.id || '');
  const myAnimals = getAnimalsByFarmer(user?.id || '');
  const myRequests = getRequestsByFarmer(user?.id || '');
  const openRequests = myRequests.filter(r => r.status !== 'Completed');
  const sickAnimals = myAnimals.filter(a => a.healthStatus === 'Sick' || a.healthStatus === 'Recovering');
  const healthyCount = myAnimals.filter(a => a.healthStatus === 'Healthy').length;
  const sickCount = myAnimals.filter(a => a.healthStatus === 'Sick').length + myAnimals.filter(a => a.healthStatus === 'Recovering').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{greeting}, {(user?.full_name ?? user?.email ?? '').split(' ')[0]} 🐄</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your herd at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Animals', value: myAnimals.length, color: 'text-foreground', accent: false },
          { label: 'Healthy', value: healthyCount, color: 'text-success', accent: true },
          { label: 'Sick / Recovering', value: sickCount, color: 'text-danger', accent: false },
          { label: 'Open Requests', value: openRequests.length, color: 'text-warning', accent: false },
        ].map((s, i) => (
          <div key={s.label} className={`bg-card rounded-xl border border-border p-5 transition-shadow duration-150 hover:shadow-sm ${i === 0 ? 'md:col-span-1' : ''}`}>
            <p className={`text-3xl font-bold ${s.color} tracking-tight`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* My Farms */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Farms</h2>
          <Link to="/farms" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline transition-colors">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {myFarms.map(farm => (
            <Link key={farm.id} to={`/farms/${farm.id}`} className="min-w-[210px] max-w-[210px] shrink-0">
              <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-150 active:scale-[0.98] h-full">
                <h3 className="font-semibold text-sm text-foreground">{farm.name}</h3>
                <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{farm.type}</span>
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>{myAnimals.filter(a => a.farmId === farm.id).length} animals</span>
                  <span>{farm.hectares} ha</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Animals Needing Attention */}
      {sickAnimals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" /> Animals Needing Attention
          </h2>
          <div className="space-y-2">
            {sickAnimals.slice(0, 5).map(animal => {
              const farm = farms.find(f => f.id === animal.farmId);
              return (
                <Link key={animal.id} to={`/animals/${animal.id}`} className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{animal.name} <span className="text-muted-foreground">({animal.tagNumber})</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">{animal.species} · {farm?.name}</p>
                    </div>
                    <StatusBadge status={animal.healthStatus} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Open Vet Requests */}
      {openRequests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Open Vet Requests</h2>
          <div className="space-y-2">
            {openRequests.map(req => {
              const animal = getAnimalById(req.animalId);
              return (
                <Link key={req.id} to={`/vet-requests/${req.id}`} className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{req.dateSubmitted}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={req.urgency} />
                      <CaseStatusBadge status={req.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        {activityEvents.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No activity yet" description="Your recent health logs and updates will appear here." />
        ) : (
          <div className="space-y-2">
            {activityEvents.slice(0, 5).map(evt => (
              <div key={evt.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <p className="text-sm text-foreground">{evt.description}</p>
                <p className="text-xs text-muted-foreground shrink-0 ml-4">{evt.date}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
