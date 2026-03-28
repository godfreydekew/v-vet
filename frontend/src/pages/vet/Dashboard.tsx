import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchVetRequests } from '@/lib/services/vetRequests.service';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, Loader2 } from 'lucide-react';

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function VetDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['vet-requests'],
    queryFn: () => fetchVetRequests({ limit: 200 }),
  });

  const allCases = data?.data ?? [];
  const activeCases = allCases.filter((c) => c.status !== 'completed' && c.status !== 'cancelled');
  const completedCases = allCases.filter((c) => c.status === 'completed');
  const urgentCases = activeCases.filter((c) => c.urgency === 'high' || c.urgency === 'emergency');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.full_name ?? user?.email ?? '').split(' ')[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your case overview for today.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Total Cases', value: allCases.length, color: 'text-foreground' },
              { label: 'Active', value: activeCases.length, color: 'text-yellow-600 dark:text-yellow-400' },
              { label: 'Completed', value: completedCases.length, color: 'text-green-600 dark:text-green-400' },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow duration-150">
                <p className={`text-3xl font-bold ${s.color} tracking-tight`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Urgent cases */}
          {urgentCases.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" /> High Priority
              </h2>
              <div className="space-y-2">
                {urgentCases.map((c) => (
                  <Link
                    key={c.id}
                    to={`/vet/cases/${c.id}`}
                    className="block bg-card rounded-xl border border-orange-500/30 p-4 hover:border-orange-500/50 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {c.livestock_name ?? 'Unnamed'}
                          {c.livestock_tag && <span className="text-muted-foreground"> ({c.livestock_tag})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.livestock_species}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${URGENCY_COLORS[c.urgency]}`}>
                        {c.urgency}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Active cases */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Active Cases</h2>
              <Link to="/vet/cases" className="text-sm text-primary font-medium hover:underline">
                View All
              </Link>
            </div>
            {activeCases.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No active cases" description="Assigned cases will appear here." />
            ) : (
              <div className="space-y-2">
                {activeCases.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    to={`/vet/cases/${c.id}`}
                    className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {c.livestock_name ?? 'Unnamed'}
                          {c.livestock_tag && <span className="text-muted-foreground"> ({c.livestock_tag})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {c.livestock_species} · {new Date(c.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${URGENCY_COLORS[c.urgency]}`}>
                        {c.urgency}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
