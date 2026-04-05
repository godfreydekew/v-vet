import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLivestock,
  type HealthStatus,
  type LifecycleStatus,
} from "@/lib/services/livestock.service";
import { fetchFarms } from "@/lib/services/farms.service";
import EmptyState from "@/components/EmptyState";
import { Search, PawPrint, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const HEALTH_OPTIONS: (HealthStatus | "all")[] = [
  "all",
  "healthy",
  "sick",
  "recovering",
  "deceased",
];
const LIFECYCLE_OPTIONS: (LifecycleStatus | "all")[] = [
  "all",
  "active",
  "sold",
  "deceased",
  "transferred",
  "slaughtered",
  "missing",
  "other",
];

const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sick: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  recovering:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  deceased: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function AdminLivestock() {
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<HealthStatus | "all">("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    LifecycleStatus | "all"
  >("all");

  const livestockQuery = useQuery({
    queryKey: ["admin-livestock"],
    queryFn: () => fetchLivestock({ limit: 500 }),
  });

  const farmsQuery = useQuery({
    queryKey: ["admin-farms"],
    queryFn: () => fetchFarms({ limit: 500 }),
  });

  const livestock = livestockQuery.data?.data ?? [];
  const farms = farmsQuery.data?.data ?? [];

  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f.name]));

  const filtered = livestock.filter((a) => {
    if (healthFilter !== "all" && a.health_status !== healthFilter)
      return false;
    if (lifecycleFilter !== "all" && a.lifecycle_status !== lifecycleFilter)
      return false;
    if (search) {
      const q = search.toLowerCase();
      const inName = (a.name ?? "").toLowerCase().includes(q);
      const inTag = (a.tag_number ?? "").toLowerCase().includes(q);
      if (!inName && !inTag) return false;
    }
    return true;
  });

  const isLoading = livestockQuery.isLoading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          All Livestock
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading
            ? "Loading…"
            : `${livestock.length} animal${livestock.length !== 1 ? "s" : ""} across all farms`}
        </p>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search by name or tag…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {HEALTH_OPTIONS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHealthFilter(h)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              healthFilter === h
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {h === "all"
              ? "All Health"
              : h.charAt(0).toUpperCase() + h.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {LIFECYCLE_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setLifecycleFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              lifecycleFilter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all"
              ? "All Lifecycle"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No animals found"
          description="Adjust your filters to find livestock."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((animal) => (
            <Link
              key={animal.id}
              to={`/animals/${animal.id}`}
              className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {animal.name ?? "Unnamed"}
                    {animal.tag_number && (
                      <span className="text-muted-foreground ml-1">
                        ({animal.tag_number})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {[
                      animal.species,
                      animal.breed,
                      farmMap[animal.farm_id]
                        ? `@ ${farmMap[animal.farm_id]}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${HEALTH_COLORS[animal.health_status]}`}
                >
                  {animal.health_status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
