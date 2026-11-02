import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCheck,
  Image as ImageIcon,
  MapPin,
  Play,
  Stethoscope,
} from "lucide-react";
import farmerCheckImage from "@/assets/problem-farmer-check.webp";

// Illustrative product fragments used on the public site.
// They show how a single example case looks at each step; none of it is live data.
// WhatsApp fragments use the phone's system font and WhatsApp's colours (font-chat, wa-*);
// web app fragments use Inter and the app's own palette (font-app, app-*), so they read as
// product screenshots rather than marketing copy.

const WAVEFORM_BARS = [6, 10, 16, 9, 14, 20, 12, 7, 15, 18, 10, 6, 12, 16, 9, 5, 11, 14, 8, 6];

const chatShadow = "shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]";
const appCardShadow = "shadow-[0_10px_30px_-14px_rgba(17,33,17,0.3)]";

function Waveform({ barClass = "bg-wa-meta/60", height = "h-6" }: { barClass?: string; height?: string }) {
  return (
    <div className={`flex ${height} flex-1 items-center gap-[3px]`} aria-hidden="true">
      {WAVEFORM_BARS.map((barHeight, index) => (
        <span key={index} className={`w-[3px] rounded-full ${barClass}`} style={{ height: barHeight }} />
      ))}
    </div>
  );
}

function ChatMeta({ time, read = false }: { time: string; read?: boolean }) {
  return (
    <span className="relative top-1 ml-2 inline-flex items-center gap-0.5 whitespace-nowrap align-bottom text-[11px] text-wa-meta">
      {time}
      {read && <CheckCheck size={14} className="text-[#53BDEB]" aria-hidden="true" />}
    </span>
  );
}

export function VoiceNoteBubble({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-lg rounded-tl-none bg-white p-2.5 font-chat text-wa-ink ${chatShadow}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wa-teal text-white">
          <Play size={14} fill="currentColor" aria-hidden="true" />
        </span>
        <Waveform />
        <span className="text-xs text-wa-meta">0:23</span>
      </div>
      {!compact && (
        <p className="mt-2.5 border-t border-black/5 pt-2.5 text-[13.5px] leading-snug">
          “My cow Shumba has not eaten since yesterday and she is weak.”
          <span className="mt-1 block text-xs text-wa-meta">Voice note in Shona, translated</span>
        </p>
      )}
    </div>
  );
}

export function PhotoAttachedBubble() {
  return (
    <div className={`flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 font-chat text-[13.5px] text-wa-ink ${chatShadow}`}>
      <ImageIcon size={16} className="text-wa-meta" aria-hidden="true" />
      1 photo attached
    </div>
  );
}

// A farmer reporting a problem in WhatsApp: a Shona text, a voice note and a photo.
export function ReportThread() {
  return (
    <div className="w-full max-w-[290px] space-y-1.5 rounded-2xl bg-wa-chat p-3 font-chat text-[13.5px] leading-snug text-wa-ink">
      <div className={`ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-wa-out px-2.5 py-1.5 ${chatShadow}`}>
        Mombe yangu haisi kudya
        <ChatMeta time="08:41" read />
      </div>
      <div className={`ml-auto flex w-[85%] items-center gap-2.5 rounded-lg bg-wa-out px-2.5 py-2 ${chatShadow}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wa-teal text-white">
          <Play size={12} fill="currentColor" aria-hidden="true" />
        </span>
        <Waveform barClass="bg-wa-teal/50" height="h-5" />
        <span className="text-[11px] text-wa-meta">0:23</span>
      </div>
      <div className={`ml-auto w-fit rounded-lg rounded-tr-none bg-wa-out p-1 ${chatShadow}`}>
        <img src={farmerCheckImage} alt="" className="h-20 w-36 rounded-md object-cover object-[50%_35%]" />
        <span className="flex justify-end px-1 pt-0.5">
          <ChatMeta time="08:42" read />
        </span>
      </div>
    </div>
  );
}

type Tier = {
  name: string;
  action: string;
  dotClass: string;
};

export const TRIAGE_TIERS: Tier[] = [
  { name: "Low risk", action: "Recommend and monitor", dotClass: "bg-app-primary" },
  { name: "Moderate risk", action: "Ask more questions", dotClass: "bg-amber-500" },
  { name: "High risk", action: "Send to a vet", dotClass: "bg-red-600" },
];

export function TierPills({ activeIndex }: { activeIndex: number }) {
  return (
    <ul className="space-y-1.5 font-app">
      {TRIAGE_TIERS.map((tier, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={tier.name}
            className={
              isActive
                ? "flex items-center gap-2.5 whitespace-nowrap rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-app-ink shadow-[0_6px_18px_-10px_rgba(17,33,17,0.35)] ring-1 ring-app-line"
                : "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm text-app-muted"
            }
          >
            <span className={`h-2 w-2 rounded-full ${tier.dotClass}`} aria-hidden="true" />
            {tier.name}
            {isActive && <span className="ml-auto text-xs font-medium text-app-muted">{tier.action}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function TriageReason() {
  return (
    <div className={`rounded-xl bg-white p-4 font-app text-sm leading-relaxed text-app-ink ring-1 ring-app-line ${appCardShadow}`}>
      <p className="font-semibold">Why this was flagged</p>
      <p className="mt-1 text-app-muted">Not eating for 2 days, weakness, getting worse. A vet should see this case today.</p>
      <p className="mt-3 text-xs text-app-muted">
        <span className="mr-1.5 rounded-md bg-app-bg px-2 py-0.5 font-medium text-app-ink">Confidence: moderate</span>
        Each alert says how sure V-Vet is.
      </p>
    </div>
  );
}

export function VetCaseCard() {
  return (
    <div className={`rounded-xl bg-white p-4 text-left font-app ring-1 ring-app-line ${appCardShadow}`}>
      <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        <AlertTriangle size={14} aria-hidden="true" />
        Vet review needed
      </div>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-app-muted">
            <MapPin size={12} aria-hidden="true" /> Location
          </dt>
          <dd className="font-medium text-app-ink">Chivhu</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-app-muted">
            <Stethoscope size={12} aria-hidden="true" /> Symptoms
          </dt>
          <dd className="text-right font-medium text-app-ink">Not eating, weak</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-app-muted">
            <ImageIcon size={12} aria-hidden="true" /> Media
          </dt>
          <dd className="font-medium text-app-ink">1 photo, 1 voice note</dd>
        </div>
      </dl>
    </div>
  );
}

type QueueCase = {
  animal: string;
  summary: string;
  urgency: "High" | "Moderate" | "Low";
  received: string;
};

const QUEUE: QueueCase[] = [
  { animal: "Shumba · cow", summary: "Not eating for 2 days, weak", urgency: "High", received: "8 min ago" },
  { animal: "BIN-7A2-22-0031 · heifer", summary: "Limping, swollen hoof", urgency: "Moderate", received: "1 h ago" },
  { animal: "Nyasha · goat", summary: "Mild cough, still eating", urgency: "Low", received: "3 h ago" },
];

const URGENCY_STYLE: Record<QueueCase["urgency"], string> = {
  High: "bg-red-50 text-red-700",
  Moderate: "bg-amber-50 text-amber-800",
  Low: "bg-app-bg text-app-primary",
};

export function VetQueue() {
  return (
    <div className="overflow-hidden rounded-xl bg-white font-app shadow-[0_16px_40px_-18px_rgba(17,33,17,0.35)] ring-1 ring-app-line">
      {/* macOS window title bar */}
      <div className="relative flex items-center gap-2 border-b border-black/[0.06] bg-[#F6F6F6] px-3.5 py-2.5" aria-hidden="true">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57] ring-1 ring-inset ring-black/10" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E] ring-1 ring-inset ring-black/10" />
        <span className="h-3 w-3 rounded-full bg-[#28C840] ring-1 ring-inset ring-black/10" />
        <span className="absolute inset-x-0 text-center text-[11px] font-medium text-[#6E6E6E]">
          V-Vet · Vet dashboard
        </span>
      </div>
      <div className="p-2">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold text-app-ink">Case queue</span>
          <span className="rounded-md bg-app-bg px-2 py-0.5 text-xs text-app-muted">Sorted by urgency</span>
        </div>
        <ul className="divide-y divide-app-line">
          {QUEUE.map((item) => (
            <li key={item.animal} className="flex items-center justify-between gap-4 px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-app-ink">{item.animal}</p>
                <p className="truncate text-xs text-app-muted">
                  {item.summary} · {item.received}
                </p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${URGENCY_STYLE[item.urgency]}`}>
                {item.urgency}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FollowUpThread() {
  return (
    <div className="space-y-1.5 rounded-2xl bg-wa-chat p-3 font-chat text-[13.5px] leading-snug text-wa-ink">
      <div className={`w-fit max-w-[85%] rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 ${chatShadow}`}>
        How is Shumba today? Is she eating?
        <ChatMeta time="09:00" />
      </div>
      <div className={`ml-auto w-fit max-w-[85%] rounded-lg rounded-tr-none bg-wa-out px-2.5 py-1.5 ${chatShadow}`}>
        Yes, she is eating again.
        <ChatMeta time="09:12" read />
      </div>
      <div className="flex justify-center pt-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 text-xs text-wa-meta">
          <Check size={12} className="text-wa-teal" aria-hidden="true" />
          Outcome recorded: recovered
        </span>
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
    <div className="h-full bg-[#0B141A] px-3 pt-3 font-chat">
      <div className="ml-auto hidden w-max rounded-lg rounded-tr-sm bg-[#144D37] px-2.5 py-1 text-[11px] text-white sm:block">
        Hello
      </div>
      <div className="max-w-[92%] rounded-lg rounded-tl-sm bg-[#202C33] px-2.5 py-2 text-[11px] leading-snug text-white/90 sm:mt-2">
        <p className="whitespace-nowrap font-semibold text-white">Welcome to V&#8209;Vet!</p>
        <p className="mt-1 text-[10px] leading-snug sm:text-[11px]">I help farmers keep animals healthy.</p>
      </div>
    </div>
  );
}

function HeroCaseStep({
  label,
  surfaceClass,
  children,
}: {
  label: string;
  surfaceClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 text-left">
      <p className="mb-1.5 text-[13px] font-semibold text-landing-muted md:mb-2.5">{label}</p>
      <div className={`rounded-[14px] p-3 text-sm leading-snug md:min-h-[112px] ${surfaceClass}`}>{children}</div>
    </div>
  );
}

function HeroCaseArrow() {
  return (
    <ArrowRight
      size={18}
      className="shrink-0 rotate-90 self-center text-landing-pine md:mt-7 md:rotate-0"
      aria-hidden="true"
    />
  );
}

// The hero's example case, followed from the farmer's report to the vet.
// Each step is drawn in the surface it happens on: WhatsApp, V-Vet's triage, the vet dashboard.
export function HeroCasePanel() {
  return (
    <figure>
      <div className="flex flex-col gap-2 rounded-[24px] bg-white p-3 shadow-[0_30px_60px_-30px_rgba(17,33,17,0.45)] md:flex-row md:gap-3.5 md:rounded-[28px] md:p-[22px]">
        <HeroCaseStep label="Farmer, on WhatsApp" surfaceClass="bg-wa-chat font-chat text-wa-ink">
          <div className={`rounded-lg rounded-tr-none bg-wa-out px-2.5 py-2 ${chatShadow}`}>
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wa-teal text-white">
                <Play size={10} fill="currentColor" aria-hidden="true" />
              </span>
              <Waveform barClass="bg-wa-teal/50" height="h-4" />
            </div>
            <p className="text-[13px] md:mt-1.5">“My cow Shumba has not eaten since yesterday.”</p>
          </div>
        </HeroCaseStep>
        <HeroCaseArrow />
        <HeroCaseStep label="V-Vet triage" surfaceClass="bg-app-bg font-app text-app-ink">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden="true" />
            High risk
          </span>
          <p className="mt-2 text-[13px]">A vet should see this case today.</p>
        </HeroCaseStep>
        <HeroCaseArrow />
        <HeroCaseStep label="Vet dashboard" surfaceClass="bg-app-bg font-app text-app-ink">
          <p className="hidden text-[13px] font-semibold md:block">Shumba · cow</p>
          <p className="text-[13px] text-app-muted md:mt-1">Case received with symptoms, media and history.</p>
        </HeroCaseStep>
      </div>
    </figure>
  );
}

const REGISTRATION_FIELDS = [
  { label: "Name", value: "Shumba" },
  { label: "Species", value: "Cattle" },
  { label: "Sex", value: "Female" },
  { label: "Age", value: "About 4 years" },
];

// Illustrates the interactive WhatsApp form (a WhatsApp Flow) a farmer fills in to register an animal.
export function RegistrationForm() {
  return (
    <div className={`w-full max-w-[290px] overflow-hidden rounded-2xl bg-white font-chat text-wa-ink ring-1 ring-black/5 ${appCardShadow}`}>
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
        <span className="text-[15px] font-semibold">Register an animal</span>
        <span className="text-lg leading-none text-wa-meta" aria-hidden="true">
          ×
        </span>
      </div>
      <dl className="space-y-2 px-4 py-3">
        {REGISTRATION_FIELDS.map((field) => (
          <div key={field.label}>
            <dt className="text-[11px] text-wa-meta">{field.label}</dt>
            <dd className="mt-0.5 border-b border-black/10 pb-1 text-[13.5px]">{field.value}</dd>
          </div>
        ))}
      </dl>
      <div className="px-4 pb-3">
        <div className="rounded-full bg-wa-teal py-1.5 text-center text-[13px] font-semibold text-white">Send</div>
      </div>
    </div>
  );
}
