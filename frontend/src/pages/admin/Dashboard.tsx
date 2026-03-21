import { demoUsers, farms, animals, vetRequests, activityEvents } from '@/data/mockData';
import { UrgencyBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const farmerCount = demoUsers.filter(u => u.role === 'farmer').length;
  const vetCount = demoUsers.filter(u => u.role === 'vet').length;
  const openRequests = vetRequests.filter(r => r.status !== 'Completed').length;
  const emergencies = vetRequests.filter(r => r.urgency === 'Emergency' && r.status !== 'Completed').length;
  const unassigned = vetRequests.filter(r => r.status === 'Pending' && !r.vetId);
  const vets = demoUsers.filter(u => u.role === 'vet');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{greeting}, Admin 🌍</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Farmers', value: farmerCount },
          { label: 'Vets', value: vetCount },
          { label: 'Farms', value: farms.length },
          { label: 'Livestock', value: animals.length },
          { label: 'Open Requests', value: openRequests, color: 'text-warning' },
          { label: 'Emergencies', value: emergencies, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow duration-150">
            <p className={`text-3xl font-bold ${s.color || 'text-foreground'} tracking-tight`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" /> Unassigned Requests
          </h2>
          <div className="space-y-2">
            {unassigned.map(r => (
              <Link key={r.id} to="/admin/requests" className="block bg-card rounded-xl border border-warning/30 p-4 text-sm text-foreground hover:border-warning/50 hover:shadow-sm transition-all duration-150">
                <div className="flex items-center justify-between">
                  <span>Request #{r.id}</span>
                  <UrgencyBadge urgency={r.urgency} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Vet Availability</h2>
        <div className="space-y-2">
          {vets.map(v => (
            <div key={v.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-sm transition-shadow duration-150">
              <span className="text-sm font-medium text-foreground">{v.name}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${v.availability === 'Available' ? 'bg-success/15 text-success' : v.availability === 'Busy' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}`}>
                {v.availability}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {activityEvents.slice(0, 5).map(evt => (
            <div key={evt.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <p className="text-sm text-foreground">{evt.description}</p>
              <p className="text-xs text-muted-foreground shrink-0 ml-4">{evt.date}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
