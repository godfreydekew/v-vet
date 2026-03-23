import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/services/users.service';
import { fetchFarms } from '@/lib/services/farms.service';
import { fetchLivestock } from '@/lib/services/livestock.service';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchUsers({ limit: 500 }),
  });

  const farmsQuery = useQuery({
    queryKey: ['admin-farms'],
    queryFn: () => fetchFarms({ limit: 500 }),
  });

  const livestockQuery = useQuery({
    queryKey: ['admin-livestock'],
    queryFn: () => fetchLivestock({ limit: 500 }),
  });

  const users = usersQuery.data?.data ?? [];
  const farms = farmsQuery.data?.data ?? [];
  const livestock = livestockQuery.data?.data ?? [];

  const farmerCount = users.filter((u) => u.role === 'farmer').length;
  const vetCount = users.filter((u) => u.role === 'vet').length;
  const sickCount = livestock.filter(
    (a) => a.health_status === 'sick' || a.health_status === 'recovering'
  ).length;

  const isLoading = usersQuery.isLoading || farmsQuery.isLoading || livestockQuery.isLoading;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-8">
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
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Farmers', value: farmerCount, color: 'text-foreground', href: '/admin/users' },
              { label: 'Vets', value: vetCount, color: 'text-foreground', href: '/admin/users' },
              { label: 'Farms', value: farms.length, color: 'text-foreground', href: '/admin/farms' },
              { label: 'Livestock', value: livestock.length, color: 'text-foreground', href: '/admin/livestock' },
              { label: 'Sick / Recovering', value: sickCount, color: 'text-red-600 dark:text-red-400', href: '/admin/livestock' },
              { label: 'Total Users', value: users.length, color: 'text-foreground', href: '/admin/users' },
            ].map((s) => (
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

          {/* Sick animals highlight */}
          {sickCount > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Animals Needing Attention</h2>
              <div className="space-y-2">
                {livestock
                  .filter((a) => a.health_status === 'sick' || a.health_status === 'recovering')
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
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {animal.species}
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
