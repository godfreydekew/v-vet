import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiError } from '@/lib/api';
import {
  fetchFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  type Farm,
  type FarmType,
  type FarmCreatePayload,
} from '@/lib/services/farms.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EmptyState from '@/components/EmptyState';
import { Plus, Building2, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FARM_TYPE_LABELS: Record<FarmType, string> = {
  livestock: 'Livestock',
  dairy: 'Dairy',
  poultry: 'Poultry',
  mixed: 'Mixed',
  crop: 'Crop',
};

const EMPTY_FORM: FarmCreatePayload = {
  name: '',
  farm_type: 'livestock',
  city: '',
  country: '',
  address: '',
  size_hectares: null,
  description: '',
  is_active: true,
};

function FarmFormDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  defaultValues: FarmCreatePayload;
  onSubmit: (values: FarmCreatePayload) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FarmCreatePayload>(defaultValues);

  // Sync when dialog re-opens with different defaults (edit mode)
  const handleOpenChange = (v: boolean) => {
    if (v) setForm(defaultValues);
    onOpenChange(v);
  };

  const field = (key: keyof FarmCreatePayload) => ({
    value: (form[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Farm Name *</Label>
            <Input placeholder="e.g. Sunrise Farm" required {...field('name')} />
          </div>
          <div className="space-y-2">
            <Label>Farm Type *</Label>
            <Select
              value={form.farm_type}
              onValueChange={(v) => setForm((p) => ({ ...p, farm_type: v as FarmType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FARM_TYPE_LABELS) as [FarmType, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input placeholder="City" {...field('city')} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input placeholder="Country" {...field('country')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input placeholder="Street / area" {...field('address')} />
          </div>
          <div className="space-y-2">
            <Label>Size (hectares)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={form.size_hectares ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  size_hectares: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="Optional notes about this farm" {...field('description')} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={15} className="animate-spin mr-2" />}
              Save Farm
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MyFarms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editFarm, setEditFarm] = useState<Farm | null>(null);
  const [deleteFarmTarget, setDeleteFarmTarget] = useState<Farm | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['farms'],
    queryFn: () => fetchFarms(),
  });

  const createMutation = useMutation({
    mutationFn: createFarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: 'Farm added successfully.' });
      setCreateOpen(false);
    },
    onError: (err) => toast({ title: getApiError(err), variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FarmCreatePayload }) =>
      updateFarm(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: 'Farm updated.' });
      setEditFarm(null);
    },
    onError: (err) => toast({ title: getApiError(err), variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFarm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: 'Farm deleted.' });
      setDeleteFarmTarget(null);
    },
    onError: (err) => toast({ title: getApiError(err), variant: 'destructive' }),
  });

  const farms = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            My Farms
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading…' : `${farms.length} farm${farms.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Add Farm
        </Button>
      </div>

      {/* Create dialog */}
      <FarmFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add New Farm"
        defaultValues={EMPTY_FORM}
        onSubmit={(values) => createMutation.mutate(values)}
        isPending={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editFarm && (
        <FarmFormDialog
          open={!!editFarm}
          onOpenChange={(v) => { if (!v) setEditFarm(null); }}
          title="Edit Farm"
          defaultValues={{
            name: editFarm.name,
            farm_type: editFarm.farm_type,
            city: editFarm.city ?? '',
            country: editFarm.country ?? '',
            address: editFarm.address ?? '',
            size_hectares: editFarm.size_hectares,
            description: editFarm.description ?? '',
            is_active: editFarm.is_active,
          }}
          onSubmit={(values) => updateMutation.mutate({ id: editFarm.id, payload: values })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteFarmTarget}
        onOpenChange={(v) => { if (!v) setDeleteFarmTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteFarmTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the farm. All animals must be removed first.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteFarmTarget && deleteMutation.mutate(deleteFarmTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin mr-1" /> : null}
              Delete Farm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-center text-sm text-destructive py-10">
          Unable to load farms. Please refresh and try again.
        </p>
      ) : farms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No farms yet"
          description="Add your first farm to start tracking your livestock."
          actionLabel="Add Farm"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <div key={farm.id} className="bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-150">
              <Link to={`/farms/${farm.id}`} className="block p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{farm.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[farm.city, farm.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <span className="text-xs bg-accent text-muted-foreground px-2 py-0.5 rounded-full">
                    {FARM_TYPE_LABELS[farm.farm_type] ?? farm.farm_type}
                  </span>
                </div>
                {farm.size_hectares != null && (
                  <p className="text-xs text-muted-foreground mt-3">{farm.size_hectares} ha</p>
                )}
              </Link>
              <div className="flex gap-1 px-4 pb-3 border-t border-border/50 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setEditFarm(farm)}
                >
                  <Pencil size={13} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={() => setDeleteFarmTarget(farm)}
                >
                  <Trash2 size={13} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
