import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fetchUsers } from '@/lib/services/users.service';
import { fetchLivestock } from '@/lib/services/livestock.service';
import { fetchAdminFarmers } from '@/lib/services/admin.service';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const farmersQuery = useQuery({
    queryKey: ['admin-farmers'],
    queryFn: fetchAdminFarmers,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchUsers({ limit: 500 }),
  });

  const livestockQuery = useQuery({
    queryKey: ['admin-livestock'],
    queryFn: () => fetchLivestock({ limit: 500 }),
  });

  const farmers = farmersQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const livestock = livestockQuery.data?.data ?? [];

  const vetCount = users.filter((u) => u.role === 'vet').length;
  const onboardingCount = farmers.filter((f) => f.status === 'onboarding').length;
  const activeThisWeekCount = farmers.filter((f) => f.messages_last_7_days > 0).length;

  let messagesThisWeek = 0;
  let farmCount = 0;
  let animalCount = 0;
  for (const farmer of farmers) {
    messagesThisWeek += farmer.messages_last_7_days;
    farmCount += farmer.farm_count;
    animalCount += farmer.animal_count;
  }

  const sickAnimals = livestock.filter(
    (a) =>
      a.lifecycle_status === 'active' &&
      (a.health_status === 'sick' || a.health_status === 'recovering')
  );
  const sickCount = sickAnimals.length;

  // Farmers already come back newest-first from the API.
  const newestFarmers = farmers.slice(0, 5);

  const isLoading = farmersQuery.isLoading || usersQuery.isLoading || livestockQuery.isLoading;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Farmers', value: farmers.length, color: 'text-foreground', href: '/admin/farmers' },
    { label: 'Still onboarding', value: onboardingCount, color: 'text-foreground', href: '/admin/farmers' },
    { label: 'Active this week', value: activeThisWeekCount, color: 'text-foreground', href: '/admin/farmers' },
    { label: 'Messages this week', value: messagesThisWeek, color: 'text-foreground', href: '/admin/farmers' },
    { label: 'Farms', value: farmCount, color: 'text-foreground', href: '/admin/farms' },
    { label: 'Animals', value: animalCount, color: 'text-foreground', href: '/admin/livestock' },
    { label: 'Sick / Recovering', value: sickCount, color: 'text-red-600 dark:text-red-400', href: '/admin/livestock' },
    { label: 'Vets', value: vetCount, color: 'text-foreground', href: '/admin/vets' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {greeting}, Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and management.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : farmersQuery.isError ? (
        <p className="text-center text-sm text-destructive py-10">
          Unable to load the dashboard. Please refresh and try again.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.map((s) => (
              <Link
                key={s.label}
                to={s.href}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-sm hover:border-primary/30 transition-all duration-150 block"
              >
                <p className={`text-3xl font-bold ${s.color} tracking-tight`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Newest farmer registrations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Newest Farmers</h2>
              <Link to="/admin/farmers" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            {newestFarmers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No farmers have registered yet.</p>
            ) : (
              <div className="space-y-2">
                {newestFarmers.map((farmer) => (
                  <div
                    key={farmer.user_id ?? farmer.whatsapp_user_id}
                    className="bg-card rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {farmer.full_name ?? (farmer.phone_number ? `+${farmer.phone_number}` : 'Unknown')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {farmer.district ?? 'No district'} · {farmer.animal_count} animal{farmer.animal_count !== 1 ? 's' : ''} ·{' '}
                          {farmer.message_count} message{farmer.message_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {farmer.registered_at
                            ? formatDistanceToNow(new Date(farmer.registered_at), { addSuffix: true })
                            : '—'}
                        </p>
                        {farmer.status === 'onboarding' && (
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Onboarding</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sick animals highlight */}
          {sickCount > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Animals Needing Attention</h2>
              <div className="space-y-2">
                {sickAnimals
                  .slice(0, 5)
                  .map((animal) => (
                    <Link
                      key={animal.id}
                      to={`/animals/${animal.id}`}
                      className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {animal.name ?? 'Unnamed'}
                            {animal.tag_number && (
                              <span className="text-muted-foreground ml-1">({animal.tag_number})</span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            animal.health_status === 'sick'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          {animal.health_status}
                        </span>
                      </div>
                    </Link>
                  ))}
                {sickCount > 5 && (
                  <Link
                    to="/admin/livestock"
                    className="block text-center text-sm text-primary hover:underline py-1"
                  >
                    View all {sickCount} animals needing attention
                  </Link>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
