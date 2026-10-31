import {
  AlertTriangle,
  ArrowRight,
  Check,
  Image as ImageIcon,
  MapPin,
  Play,
  Stethoscope,
} from "lucide-react";

// Illustrative product fragments used on the landing page.
// They show how a single example case looks at each step; none of it is live data.

const WAVEFORM_BARS = [6, 10, 16, 9, 14, 20, 12, 7, 15, 18, 10, 6, 12, 16, 9, 5, 11, 14, 8, 6];

export function VoiceNoteBubble({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl rounded-tl-md bg-white p-3.5 shadow-[0_8px_24px_-12px_rgba(17,33,17,0.25)] ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-landing-button text-white">
          <Play size={14} fill="currentColor" aria-hidden="true" />
        </span>
        <div className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden="true">
          {WAVEFORM_BARS.map((height, index) => (
            <span
              key={index}
              className="w-[3px] rounded-full bg-landing-ink/40"
              style={{ height }}
            />
          ))}
        </div>
        <span className="text-xs text-landing-muted">0:23</span>
      </div>
      {!compact && (
        <p className="mt-3 border-t border-landing-line pt-3 text-sm leading-snug text-landing-ink">
          “My cow Shumba has not eaten since yesterday and she is weak.”
          <span className="mt-1 block text-xs text-landing-muted">
            Voice note in Shona, translated
          </span>
        </p>
      )}
    </div>
  );
}

type Tier = {
  name: string;
  action: string;
  dotClass: string;
};

export const TRIAGE_TIERS: Tier[] = [
  { name: "Low risk", action: "Recommend an action and monitor", dotClass: "bg-landing-accent" },
  { name: "Moderate risk", action: "Ask more questions", dotClass: "bg-amber-500" },
  { name: "High risk", action: "Send to a vet with full context", dotClass: "bg-red-600" },
];

export function TierPills({ activeIndex }: { activeIndex: number }) {
  const sizeClass = "px-4 py-2 text-sm";
  return (
    <ul className="space-y-2">
      {TRIAGE_TIERS.map((tier, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={tier.name}
            className={
              isActive
                ? `flex items-center gap-2.5 whitespace-nowrap rounded-full bg-white font-semibold text-landing-ink shadow-[0_6px_18px_-10px_rgba(17,33,17,0.35)] ring-1 ring-black/5 ${sizeClass}`
                : `flex items-center gap-2.5 whitespace-nowrap rounded-full text-landing-muted ${sizeClass}`
            }
          >
            <span className={`h-2 w-2 rounded-full ${tier.dotClass}`} aria-hidden="true" />
            {tier.name}
          </li>
        );
      })}
    </ul>
  );
}

export function VetCaseCard() {
  return (
    <div className="rounded-2xl bg-white p-4 text-left shadow-[0_10px_30px_-14px_rgba(17,33,17,0.3)] ring-1 ring-black/5">
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        <AlertTriangle size={14} aria-hidden="true" />
        Vet review needed
      </div>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-landing-muted">
            <MapPin size={12} aria-hidden="true" /> Location
          </dt>
          <dd className="font-medium text-landing-ink">Chivhu</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-landing-muted">
            <Stethoscope size={12} aria-hidden="true" /> Symptoms
          </dt>
          <dd className="text-right font-medium text-landing-ink">Not eating, weak</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-landing-muted">
            <ImageIcon size={12} aria-hidden="true" /> Media
          </dt>
          <dd className="font-medium text-landing-ink">1 photo, 1 voice note</dd>
        </div>
      </dl>
    </div>
  );
}

type QueueCase = {
  animal: string;
  summary: string;
  urgency: "High" | "Moderate" | "Low";
};

const QUEUE: QueueCase[] = [
  { animal: "Shumba · cow", summary: "Not eating for 2 days, weak", urgency: "High" },
  { animal: "BIN-7A2-22-0031 · heifer", summary: "Limping, swollen hoof", urgency: "Moderate" },
  { animal: "Nyasha · goat", summary: "Mild cough, still eating", urgency: "Low" },
];

const URGENCY_STYLE: Record<QueueCase["urgency"], string> = {
  High: "bg-red-50 text-red-700",
  Moderate: "bg-amber-50 text-amber-800",
  Low: "bg-landing-mint text-landing-pine",
};

export function VetQueue() {
  return (
    <div className="rounded-2xl bg-white p-2 shadow-[0_16px_40px_-18px_rgba(17,33,17,0.35)] ring-1 ring-black/5">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-semibold text-landing-ink">Case queue</span>
        <span className="text-xs text-landing-muted">Sorted by urgency</span>
      </div>
      <ul className="divide-y divide-landing-line">
        {QUEUE.map((item) => (
          <li key={item.animal} className="flex items-center justify-between gap-4 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-landing-ink">{item.animal}</p>
              <p className="truncate text-xs text-landing-muted">{item.summary}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${URGENCY_STYLE[item.urgency]}`}
            >
              {item.urgency}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FollowUpThread() {
  return (
    <div className="space-y-2.5">
      <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm text-landing-ink shadow-[0_6px_18px_-10px_rgba(17,33,17,0.3)] ring-1 ring-black/5">
        How is Shumba today? Is she eating?
      </div>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-[#D9FDD3] px-3.5 py-2.5 text-sm text-landing-ink">
        Yes, she is eating again.
      </div>
      <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-landing-pine">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-landing-mint">
          <Check size={12} aria-hidden="true" />
        </span>
        Outcome recorded: recovered
      </div>
    </div>
  );
}

export function ExampleChip({ label = "Example" }: { label?: string }) {
  return (
    <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-landing-muted ring-1 ring-black/5">
      {label}
    </span>
  );
}

// The opening of the real V-Vet WhatsApp welcome message, redrawn so it stays legible at small sizes.
export function WhatsAppWelcome() {
  return (
    <div className="h-full bg-[#0B141A] px-3 pt-3">
      <div className="ml-auto hidden w-max rounded-lg rounded-tr-sm bg-[#144D37] px-2.5 py-1 text-[11px] text-white sm:block">
        Hello
      </div>
      <div className="max-w-[92%] rounded-lg rounded-tl-sm bg-[#202C33] sm:mt-2 px-2.5 py-2 text-[11px] leading-snug text-white/90">
        <p className="whitespace-nowrap font-semibold text-white">Welcome to V&#8209;Vet!</p>
        <p className="mt-1 text-[10px] leading-snug sm:text-[11px]">I help farmers keep animals healthy.</p>
      </div>
    </div>
  );
}

function HeroCaseStep({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 rounded-[14px] bg-landing-paper p-3.5 text-left md:bg-transparent md:p-0">
      <p className="mb-1.5 text-[13px] font-semibold text-landing-muted md:mb-2.5">{label}</p>
      <div className="text-sm leading-snug text-landing-ink md:min-h-[112px] md:rounded-[14px] md:bg-landing-paper md:p-3.5">
        {children}
      </div>
    </div>
  );
}

function HeroCaseArrow() {
  return (
    <ArrowRight
      size={18}
      className="shrink-0 rotate-90 self-center text-landing-accent md:mt-7 md:rotate-0"
      aria-hidden="true"
    />
  );
}

// The hero's example case, followed from the farmer's report to the vet.
export function HeroCasePanel() {
  return (
    <figure>
      <div className="flex flex-col gap-1 rounded-[24px] bg-white p-3 shadow-[0_30px_60px_-30px_rgba(17,33,17,0.45)] md:flex-row md:gap-3.5 md:rounded-[28px] md:p-[22px]">
        <HeroCaseStep label="Farmer">
          <div className="hidden h-5 items-center gap-[2px] md:flex" aria-hidden="true">
            {WAVEFORM_BARS.map((height, index) => (
              <span key={index} className="w-[3px] rounded-full bg-landing-ink/40" style={{ height }} />
            ))}
          </div>
          <p className="md:mt-2">“My cow Shumba has not eaten since yesterday.”</p>
        </HeroCaseStep>
        <HeroCaseArrow />
        <HeroCaseStep label="V-Vet">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden="true" />
            High risk
          </span>
          <p className="mt-2">A vet should see this case today.</p>
        </HeroCaseStep>
        <HeroCaseArrow />
        <HeroCaseStep label="Vet">
          <p className="hidden font-semibold md:block">Shumba · cow</p>
          <p className="text-landing-muted md:mt-1">Case received with symptoms, media and history.</p>
        </HeroCaseStep>
      </div>
      <figcaption className="mt-3 text-xs text-white/70">Example case</figcaption>
    </figure>
  );
}

const REGISTRATION_FIELDS = [
  { label: "Name", value: "Shumba" },
  { label: "Species", value: "Cattle" },
  { label: "Sex", value: "Female" },
  { label: "Age", value: "About 4 years" },
];

// Illustrates the interactive WhatsApp form a farmer fills in to register an animal.
export function RegistrationForm() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_-14px_rgba(17,33,17,0.3)] ring-1 ring-black/5">
      <p className="text-sm font-semibold text-landing-ink">Register an animal</p>
      <dl className="mt-3 space-y-2">
        {REGISTRATION_FIELDS.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between gap-3 rounded-lg bg-landing-paper px-3 py-2 text-xs"
          >
            <dt className="text-landing-muted">{field.label}</dt>
            <dd className="font-medium text-landing-ink">{field.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 rounded-full bg-landing-button py-2 text-center text-xs font-semibold text-white">
        Send
      </div>
    </div>
  );
}
