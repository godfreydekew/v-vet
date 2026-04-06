import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiError } from "@/lib/api";
import { fetchFarmById } from "@/lib/services/farms.service";
import {
  fetchLivestockById,
  updateLivestock,
  fetchHealthObservations,
  createHealthObservation,
  fetchTreatments,
  createTreatment,
  fetchVaccinations,
  createVaccination,
  type Livestock,
  type Gender,
  type HealthStatus,
  type LifecycleStatus,
  type LivestockUpdatePayload,
  type AppetiteLevel,
  type ActivityLevel,
  type HealthObservationCreatePayload,
  type TreatmentCreatePayload,
  type AdministeredBy,
  type VaccinationCreatePayload,
} from "@/lib/services/livestock.service";
import {
  createVetRequest,
  type UrgencyLevel,
  type VetRequestSubmitPayload,
} from "@/lib/services/vetRequests.service";
import { fetchVets } from "@/lib/services/users.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Plus,
  Thermometer,
  Heart,
  Wind,
  Clock,
  Stethoscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimalPhoto from "@/components/AnimalPhoto";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

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

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const months = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44),
  );
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0
    ? `${years}y ${rem}m`
    : `${years} year${years !== 1 ? "s" : ""}`;
}

function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function fmt(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Edit animal dialog
// ---------------------------------------------------------------------------

function EditAnimalDialog({
  open,
  onOpenChange,
  animal,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  animal: Livestock;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<LivestockUpdatePayload>({
    name: animal.name,
    tag_number: animal.tag_number,
    breed: animal.breed,
    gender: animal.gender,
    weight_kg: animal.weight_kg,
    date_of_birth: animal.date_of_birth,
    health_status: animal.health_status,
    lifecycle_status: animal.lifecycle_status,
    notes: animal.notes,
  });

  const mutation = useMutation({
    mutationFn: (payload: LivestockUpdatePayload) =>
      updateLivestock(animal.id, payload),
    onSuccess: () => {
      toast({ title: "Animal updated." });
      onOpenChange(false);
      onSaved();
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Animal</DialogTitle>
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
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value || null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tag Number</Label>
              <Input
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
                  setForm((p) => ({ ...p, gender: (v as Gender) || null }))
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
                value={form.health_status}
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
            <div className="space-y-2">
              <Label>Lifecycle Status</Label>
              <Select
                value={form.lifecycle_status}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    lifecycle_status: v as LifecycleStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Log observation dialog
// ---------------------------------------------------------------------------

function LogObservationDialog({
  open,
  onOpenChange,
  livestockId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  livestockId: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const empty: HealthObservationCreatePayload = {
    body_temp_celsius: null,
    heart_rate_bpm: null,
    respiratory_rate: null,
    appetite_level: null,
    activity_level: null,
    symptoms: null,
    symptom_duration_days: null,
    milk_production: null,
    notes: null,
  };
  const [form, setForm] = useState<HealthObservationCreatePayload>(empty);

  const mutation = useMutation({
    mutationFn: (payload: HealthObservationCreatePayload) =>
      createHealthObservation(livestockId, payload),
    onSuccess: () => {
      toast({ title: "Observation logged." });
      setForm(empty);
      onOpenChange(false);
      onSaved();
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Health Observation</DialogTitle>
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
              <Label>Body Temp (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="39.0"
                value={form.body_temp_celsius ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    body_temp_celsius: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Heart Rate (BPM)</Label>
              <Input
                type="number"
                placeholder="70"
                value={form.heart_rate_bpm ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    heart_rate_bpm: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Respiratory Rate</Label>
              <Input
                type="number"
                placeholder="20"
                value={form.respiratory_rate ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    respiratory_rate: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Symptom Duration (days)</Label>
              <Input
                type="number"
                placeholder="1"
                value={form.symptom_duration_days ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    symptom_duration_days: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Appetite Level</Label>
              <Select
                value={form.appetite_level ?? ""}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    appetite_level: (v as AppetiteLevel) || null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["normal", "reduced", "poor", "absent"].map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select
                value={form.activity_level ?? ""}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    activity_level: (v as ActivityLevel) || null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["normal", "lethargic", "restless", "aggressive"].map(
                    (v) => (
                      <SelectItem key={v} value={v} className="capitalize">
                        {v}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Symptoms</Label>
            <Textarea
              placeholder="Describe any symptoms observed"
              rows={2}
              value={form.symptoms ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, symptoms: e.target.value || null }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes"
              rows={2}
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
              Save Observation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Log treatment dialog
// ---------------------------------------------------------------------------

function LogTreatmentDialog({
  open,
  onOpenChange,
  livestockId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  livestockId: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<TreatmentCreatePayload>({
    treatment_name: "",
    date_given: today,
    administered_by: "farmer",
    drug_used: null,
    dosage: null,
    outcome_notes: null,
  });

  const mutation = useMutation({
    mutationFn: (payload: TreatmentCreatePayload) =>
      createTreatment(livestockId, payload),
    onSuccess: () => {
      toast({ title: "Treatment logged." });
      setForm({
        treatment_name: "",
        date_given: today,
        administered_by: "farmer",
        drug_used: null,
        dosage: null,
        outcome_notes: null,
      });
      onOpenChange(false);
      onSaved();
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Treatment</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Treatment Name *</Label>
            <Input
              required
              placeholder="e.g. Antibiotic injection"
              value={form.treatment_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, treatment_name: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Drug / Medicine</Label>
              <Input
                placeholder="e.g. Oxytetracycline"
                value={form.drug_used ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, drug_used: e.target.value || null }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dosage</Label>
              <Input
                placeholder="e.g. 5ml per 100kg"
                value={form.dosage ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dosage: e.target.value || null }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                required
                value={form.date_given}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date_given: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Administered By *</Label>
              <Select
                value={form.administered_by}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    administered_by: v as AdministeredBy,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="vet">Vet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Outcome / Notes</Label>
            <Textarea
              placeholder="How did the animal respond?"
              rows={3}
              value={form.outcome_notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  outcome_notes: e.target.value || null,
                }))
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
              Save Treatment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Log vaccination dialog
// ---------------------------------------------------------------------------

function LogVaccinationDialog({
  open,
  onOpenChange,
  livestockId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  livestockId: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<VaccinationCreatePayload>({
    vaccine_name: "",
    date_given: today,
    administered_by: "farmer",
    next_due_date: null,
    notes: null,
  });

  const mutation = useMutation({
    mutationFn: (payload: VaccinationCreatePayload) =>
      createVaccination(livestockId, payload),
    onSuccess: () => {
      toast({ title: "Vaccination logged." });
      setForm({
        vaccine_name: "",
        date_given: today,
        administered_by: "farmer",
        next_due_date: null,
        notes: null,
      });
      onOpenChange(false);
      onSaved();
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Vaccination</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Vaccine Name *</Label>
            <Input
              required
              placeholder="e.g. FMD Vaccine"
              value={form.vaccine_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, vaccine_name: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date Given *</Label>
              <Input
                type="date"
                required
                value={form.date_given}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date_given: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Administered By *</Label>
              <Select
                value={form.administered_by}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    administered_by: v as AdministeredBy,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="vet">Vet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Next Due Date</Label>
            <Input
              type="date"
              value={form.next_due_date ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  next_due_date: e.target.value || null,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes"
              rows={2}
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
              Save Vaccination
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Submit vet request dialog
// ---------------------------------------------------------------------------

function SubmitVetRequestDialog({
  open,
  onOpenChange,
  animal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  animal: Livestock;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<
    Omit<VetRequestSubmitPayload, "livestock_id">
  >({
    vet_id: "",
    urgency: "medium",
    farmer_notes: "",
  });

  const vetsQuery = useQuery({
    queryKey: ["vets"],
    queryFn: fetchVets,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => createVetRequest({ ...form, livestock_id: animal.id }),
    onSuccess: () => {
      toast({ title: "Vet request submitted." });
      onOpenChange(false);
      setForm({ vet_id: "", urgency: "medium", farmer_notes: "" });
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  const vets = vetsQuery.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Vet Request</DialogTitle>
        </DialogHeader>
        <div className="bg-accent rounded-lg px-4 py-3 text-sm font-medium text-foreground">
          {animal.name ?? "Unnamed"}{" "}
          {animal.tag_number ? `(${animal.tag_number})` : ""}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Choose a Vet *</Label>
            <Select
              value={form.vet_id}
              onValueChange={(v) => setForm((p) => ({ ...p, vet_id: v }))}
              required
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    vetsQuery.isLoading ? "Loading vets…" : "Select a vet"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {vets.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.full_name ?? v.email}
                  </SelectItem>
                ))}
                {vets.length === 0 && !vetsQuery.isLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No vets available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Urgency Level *</Label>
            <Select
              value={form.urgency}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, urgency: v as UrgencyLevel }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Describe what you've noticed</Label>
            <Textarea
              placeholder="What are the symptoms? When did it start?"
              rows={4}
              value={form.farmer_notes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, farmer_notes: e.target.value || null }))
              }
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.vet_id}>
              {mutation.isPending && (
                <Loader2 size={15} className="animate-spin mr-2" />
              )}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AnimalProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [vetRequestOpen, setVetRequestOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);
  const [vaxOpen, setVaxOpen] = useState(false);

  const animalQuery = useQuery({
    queryKey: ["livestock", id],
    queryFn: () => fetchLivestockById(id!),
    enabled: !!id,
  });
  const animal = animalQuery.data;

  const farmQuery = useQuery({
    queryKey: ["farm", animal?.farm_id],
    queryFn: () => fetchFarmById(animal!.farm_id),
    enabled: !!animal?.farm_id,
  });

  const obsQuery = useQuery({
    queryKey: ["health-obs", id],
    queryFn: () => fetchHealthObservations(id!),
    enabled: !!id,
  });

  const treatQuery = useQuery({
    queryKey: ["treatments", id],
    queryFn: () => fetchTreatments(id!),
    enabled: !!id,
  });

  const vaxQuery = useQuery({
    queryKey: ["vaccinations", id],
    queryFn: () => fetchVaccinations(id!),
    enabled: !!id,
  });

  const lifecycleMutation = useMutation({
    mutationFn: (lifecycleStatus: LifecycleStatus) =>
      updateLivestock(id!, { lifecycle_status: lifecycleStatus }),
    onSuccess: () => {
      toast({ title: "Lifecycle status updated." });
      queryClient.invalidateQueries({ queryKey: ["livestock", id] });
      queryClient.invalidateQueries({
        queryKey: ["farm-livestock", animal?.farm_id],
      });
    },
    onError: (err) =>
      toast({ title: getApiError(err), variant: "destructive" }),
  });

  if (animalQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (animalQuery.isError || !animal) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Animal not found.{" "}
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

  const farm = farmQuery.data;
  const observations = obsQuery.data?.data ?? [];
  const treatments = treatQuery.data?.data ?? [];
  const vaccinations = vaxQuery.data?.data ?? [];

  const details: [string, string | null][] = [
    ["Tag Number", animal.tag_number],
    [
      "Species",
      animal.species
        ? animal.species.charAt(0).toUpperCase() + animal.species.slice(1)
        : null,
    ],
    ["Breed", animal.breed],
    [
      "Gender",
      animal.gender
        ? animal.gender.charAt(0).toUpperCase() + animal.gender.slice(1)
        : null,
    ],
    ["Weight", animal.weight_kg != null ? `${animal.weight_kg} kg` : null],
    ["Date of Birth", animal.date_of_birth],
    ["Age", calcAge(animal.date_of_birth)],
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link
        to={`/farms/${animal.farm_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to {farm?.name ?? "Farm"}
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {animal.name ?? "Unnamed Animal"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {[animal.tag_number, animal.species, animal.breed]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground capitalize">
              {animal.gender && <span>{animal.gender}</span>}
              {calcAge(animal.date_of_birth) && (
                <span>{calcAge(animal.date_of_birth)}</span>
              )}
              {animal.weight_kg != null && <span>{animal.weight_kg} kg</span>}
            </div>
            {farm && (
              <p className="text-xs text-muted-foreground mt-2">
                Farm:{" "}
                <Link
                  to={`/farms/${farm.id}`}
                  className="text-primary hover:underline"
                >
                  {farm.name}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium capitalize ${HEALTH_COLORS[animal.health_status]}`}
            >
              • {animal.health_status}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Lifecycle</span>
              <Select
                value={animal.lifecycle_status}
                onValueChange={(v) =>
                  lifecycleMutation.mutate(v as LifecycleStatus)
                }
                disabled={lifecycleMutation.isPending}
              >
                <SelectTrigger className="w-[160px] h-8 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={() => setVetRequestOpen(true)}
              >
                <Stethoscope size={14} /> Submit Vet Request
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={14} /> Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="health">
            Health{" "}
            {observations.length > 0 && (
              <span className="ml-1 text-xs opacity-60">
                ({observations.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="treatments">
            Treatments{" "}
            {treatments.length > 0 && (
              <span className="ml-1 text-xs opacity-60">
                ({treatments.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vaccines">
            Vaccines{" "}
            {vaccinations.length > 0 && (
              <span className="ml-1 text-xs opacity-60">
                ({vaccinations.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent value="details" className="mt-4 space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-0">
            {details.map(([label, value]) =>
              value ? (
                <div
                  key={label}
                  className="flex justify-between py-2.5 border-b border-border last:border-0"
                >
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">
                    {value}
                  </span>
                </div>
              ) : null,
            )}
            {animal.notes && (
              <div className="pt-3 mt-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground mt-1">{animal.notes}</p>
              </div>
            )}
          </div>

          <AnimalPhoto
            livestockId={id!}
            animalName={animal.name}
            imageUrl={animal.image_url}
            images={animal.images}
          />
        </TabsContent>

        {/* Health tab */}
        <TabsContent value="health" className="mt-4 space-y-4">
          <Button
            type="button"
            size="sm"
            className="gap-1"
            onClick={() => setObsOpen(true)}
          >
            <Plus size={15} /> Log Observation
          </Button>
          {obsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={22}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : observations.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No observations logged yet.
            </p>
          ) : (
            <div className="space-y-3">
              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-card rounded-xl border border-border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {fmt(obs.observed_at)}
                    </p>
                    {obs.symptom_duration_days && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> {obs.symptom_duration_days} days
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {obs.body_temp_celsius && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Thermometer size={14} className="text-red-500" />
                        {obs.body_temp_celsius}°C
                      </span>
                    )}
                    {obs.heart_rate_bpm && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Heart size={14} className="text-red-500" />
                        {obs.heart_rate_bpm} BPM
                      </span>
                    )}
                    {obs.respiratory_rate && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Wind size={14} className="text-blue-500" />
                        {obs.respiratory_rate} br/min
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {obs.appetite_level && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${obs.appetite_level === "normal" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                      >
                        Appetite: {obs.appetite_level}
                      </span>
                    )}
                    {obs.activity_level && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${obs.activity_level === "normal" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}
                      >
                        Activity: {obs.activity_level}
                      </span>
                    )}
                  </div>
                  {obs.symptoms && (
                    <p className="text-sm text-foreground">{obs.symptoms}</p>
                  )}
                  {obs.notes && (
                    <p className="text-xs text-muted-foreground">{obs.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Treatments tab */}
        <TabsContent value="treatments" className="mt-4 space-y-4">
          <Button
            type="button"
            size="sm"
            className="gap-1"
            onClick={() => setTreatOpen(true)}
          >
            <Plus size={15} /> Log Treatment
          </Button>
          {treatQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={22}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : treatments.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No treatments recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {treatments.map((t) => (
                <div
                  key={t.id}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-foreground">
                      {t.treatment_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(t.date_given)}
                    </p>
                  </div>
                  {(t.drug_used || t.dosage) && (
                    <p className="text-sm text-muted-foreground">
                      {[t.drug_used, t.dosage].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Administered by: {t.administered_by}
                  </p>
                  {t.outcome_notes && (
                    <p className="text-sm text-foreground mt-2">
                      {t.outcome_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vaccines tab */}
        <TabsContent value="vaccines" className="mt-4 space-y-4">
          <Button
            type="button"
            size="sm"
            className="gap-1"
            onClick={() => setVaxOpen(true)}
          >
            <Plus size={15} /> Log Vaccination
          </Button>
          {vaxQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={22}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : vaccinations.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No vaccinations recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {vaccinations.map((v) => {
                const overdue = isOverdue(v.next_due_date);
                return (
                  <div
                    key={v.id}
                    className={`bg-card rounded-xl border p-4 ${overdue ? "border-destructive/50" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-foreground">
                        {v.vaccine_name}
                      </p>
                      {overdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Given: {fmt(v.date_given)}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Administered by: {v.administered_by}
                    </p>
                    {v.next_due_date && (
                      <p
                        className={`text-sm mt-1 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
                      >
                        Next due: {fmt(v.next_due_date)}
                      </p>
                    )}
                    {v.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {v.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vet request dialog */}
      <SubmitVetRequestDialog
        open={vetRequestOpen}
        onOpenChange={setVetRequestOpen}
        animal={animal}
      />

      {/* Edit dialog */}
      {editOpen && (
        <EditAnimalDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          animal={animal}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["livestock", id] });
            queryClient.invalidateQueries({
              queryKey: ["farm-livestock", animal.farm_id],
            });
          }}
        />
      )}

      {/* Log dialogs */}
      <LogObservationDialog
        open={obsOpen}
        onOpenChange={setObsOpen}
        livestockId={id!}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["health-obs", id] })
        }
      />
      <LogTreatmentDialog
        open={treatOpen}
        onOpenChange={setTreatOpen}
        livestockId={id!}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["treatments", id] })
        }
      />
      <LogVaccinationDialog
        open={vaxOpen}
        onOpenChange={setVaxOpen}
        livestockId={id!}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ["vaccinations", id] })
        }
      />
    </div>
  );
}
