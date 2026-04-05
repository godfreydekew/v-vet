import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiError } from "@/lib/api";
import {
  fetchFarmById,
  fetchFarmLivestock,
} from "@/lib/services/farms.service";
import {
  createLivestock,
  type Livestock,
  type HealthStatus,
  type LifecycleStatus,
  type LivestockCreatePayload,
} from "@/lib/services/livestock.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/EmptyState";
import { Plus, Search, ArrowLeft, PawPrint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HEALTH_OPTIONS: HealthStatus[] = [
  "healthy",
  "sick",
  "recovering",
  "deceased",
];
const LIFECYCLE_OPTIONS: LifecycleStatus[] = [
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

const EMPTY_FORM: LivestockCreatePayload = {
  farm_id: "",
  species: "cattle",
  name: "",
  tag_number: "",
  breed: "",
  gender: null,
  weight_kg: null,
  date_of_birth: null,
  health_status: "healthy",
  notes: "",
};

function AddAnimalDialog({
  open,
  onOpenChange,
  farmId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  farmId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<LivestockCreatePayload>({
    ...EMPTY_FORM,
    farm_id: farmId,
  });

  const mutation = useMutation({
    mutationFn: createLivestock,
    onSuccess: () => {
      toast({ title: "Animal added." });
      setForm({ ...EMPTY_FORM, farm_id: farmId });
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  const handleOpen = (v: boolean) => {
    if (v) setForm({ ...EMPTY_FORM, farm_id: farmId });
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Animal</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Bessie"
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value || null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tag Number</Label>
              <Input
                placeholder="e.g. ZW-001"
                value={form.tag_number ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tag_number: e.target.value || null }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Animal Type</Label>
              <Input value="Cow" disabled />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={form.gender ?? ""}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    gender: (v as "male" | "female" | "unknown" | null) || null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Breed</Label>
              <Input
                placeholder="e.g. Hereford"
                value={form.breed ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, breed: e.target.value || null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={form.weight_kg ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    weight_kg: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.date_of_birth ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    date_of_birth: e.target.value || null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select
                value={form.health_status ?? "healthy"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, health_status: v as HealthStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h} className="capitalize">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              placeholder="Optional notes"
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value || null }))
              }
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Add Animal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<HealthStatus | "all">("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    LifecycleStatus | "all"
  >("all");
  const [addOpen, setAddOpen] = useState(false);

  const farmQuery = useQuery({
    queryKey: ["farm", id],
    queryFn: () => fetchFarmById(id!),
    enabled: !!id,
  });

  const livestockQuery = useQuery({
    queryKey: ["farm-livestock", id],
    queryFn: () => fetchFarmLivestock(id!),
    enabled: !!id,
  });

  const farm = farmQuery.data;
  const allAnimals: Livestock[] = livestockQuery.data?.data ?? [];

  const filtered = allAnimals.filter((a) => {
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

  if (farmQuery.isError) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Farm not found.{" "}
        <button
          type="button"
          onClick={() => navigate("/farms")}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link
        to="/farms"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to Farms
      </Link>

      {farmQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : farm ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {farm.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {[farm.address, farm.city, farm.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-accent text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                {farm.farm_type}
              </span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setAddOpen(true)}
              >
                <Plus size={16} /> Add Animal
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
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
              {(["all", ...HEALTH_OPTIONS] as const).map((h) => (
                <button
                  type="button"
                  key={h}
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
              {(["all", ...LIFECYCLE_OPTIONS] as const).map((s) => (
                <button
                  type="button"
                  key={s}
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
          </div>

          {/* Animal list */}
          {livestockQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2
                size={24}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={PawPrint}
              title="No animals found"
              description={
                allAnimals.length === 0
                  ? "Add your first animal to this farm."
                  : "Try adjusting your search or filters."
              }
              actionLabel="Add Animal"
              onAction={() => setAddOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((animal) => (
                <Link
                  key={animal.id}
                  to={`/animals/${animal.id}`}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150 block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {animal.name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {[animal.tag_number, animal.species, animal.breed]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {[
                          animal.gender,
                          animal.weight_kg != null
                            ? `${animal.weight_kg} kg`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${
                        HEALTH_COLORS[animal.health_status]
                      }`}
                    >
                      {animal.health_status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}

      <AddAnimalDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        farmId={id ?? ""}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["farm-livestock", id] });
        }}
      />
    </div>
  );
}
