import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByVet, getAnimalById, getFarmById, getUserById, vetRequests, demoUsers } from '@/data/mockData';
import { UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList } from 'lucide-react';

export default function VetDashboard() {
  const { user } = useAuth();
  const myCases = getRequestsByVet(user?.id || '');
  const activeCases = myCases.filter(c => c.status !== 'Completed');
  const completedThisMonth = myCases.filter(c => c.status === 'Completed').length;
  const emergencyHigh = activeCases.filter(c => c.urgency === 'Emergency' || c.urgency === 'High');
  const followUps = myCases.filter(c => c.vetResponse?.followUpRequired && c.vetResponse?.followUpDate);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{greeting}, {user?.full_name ?? user?.email} 🩺</h1>
        <p className="text-sm text-muted-foreground mt-1">Your case overview for today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Cases', value: myCases.length, color: 'text-foreground' },
          { label: 'Pending Review', value: activeCases.length, color: 'text-warning' },
          { label: 'Completed', value: completedThisMonth, color: 'text-success' },
          { label: 'Follow-ups', value: followUps.length, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow duration-150">
            <p className={`text-3xl font-bold ${s.color} tracking-tight`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {emergencyHigh.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-danger" /> Emergency & High Priority
          </h2>
          <div className="space-y-2">
            {emergencyHigh.map(c => {
              const animal = getAnimalById(c.animalId);
              const farm = animal ? getFarmById(animal.farmId) : null;
              const farmer = getUserById(c.farmerId);
              return (
                <Link key={c.id} to={`/vet/cases/${c.id}`} className="block bg-card rounded-xl border border-danger/30 p-4 hover:border-danger/50 hover:shadow-sm transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{animal?.species} · {farmer?.name} · {farm?.name}</p>
                    </div>
                    <UrgencyBadge urgency={c.urgency} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">All Active Cases</h2>
        {activeCases.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No active cases" description="Assigned cases will appear here when they arrive." />
        ) : (
          <div className="space-y-2">
            {activeCases.map(c => {
              const animal = getAnimalById(c.animalId);
              return (
                <Link key={c.id} to={`/vet/cases/${c.id}`} className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.dateSubmitted}</p>
                    </div>
                    <div className="flex gap-2">
                      <UrgencyBadge urgency={c.urgency} />
                      <CaseStatusBadge status={c.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
