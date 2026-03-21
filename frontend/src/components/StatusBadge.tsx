import { HealthStatus } from '@/data/mockData';

interface StatusBadgeProps {
  status: HealthStatus;
  size?: 'sm' | 'md';
}

const config: Record<HealthStatus, { label: string; className: string }> = {
  Healthy: { label: 'Healthy', className: 'bg-success/15 text-success' },
  Recovering: { label: 'Recovering', className: 'bg-warning/15 text-warning' },
  Sick: { label: 'Sick', className: 'bg-danger/15 text-danger' },
  Deceased: { label: 'Deceased', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${c.className} ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Healthy' ? 'bg-success' : status === 'Recovering' ? 'bg-warning' : status === 'Sick' ? 'bg-danger' : 'bg-muted-foreground'}`} />
      {c.label}
    </span>
  );
}

interface UrgencyBadgeProps {
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
}

const urgencyConfig = {
  Low: { className: 'bg-success/15 text-success' },
  Medium: { className: 'bg-warning/15 text-warning' },
  High: { className: 'bg-danger/15 text-danger' },
  Emergency: { className: 'bg-danger text-danger-foreground' },
};

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const c = urgencyConfig[urgency];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.className}`}>
      {urgency === 'Emergency' ? '🚨 ' : ''}{urgency}
    </span>
  );
}

interface CaseStatusBadgeProps {
  status: 'Pending' | 'Assigned' | 'In Review' | 'Completed';
}

const caseConfig = {
  Pending: { className: 'bg-warning/15 text-warning' },
  Assigned: { className: 'bg-primary/15 text-primary' },
  'In Review': { className: 'bg-primary/15 text-primary' },
  Completed: { className: 'bg-success/15 text-success' },
};

export function CaseStatusBadge({ status }: CaseStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${caseConfig[status].className}`}>
      {status}
    </span>
  );
}

interface FarmTypeBadgeProps {
  type: string;
}

export function FarmTypeBadge({ type }: FarmTypeBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
      {type}
    </span>
  );
}
