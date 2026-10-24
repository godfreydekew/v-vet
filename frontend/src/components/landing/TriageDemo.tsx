import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import {
  FollowUpThread,
  TierPills,
  VetCaseCard,
  VoiceNoteBubble,
} from "@/components/landing/CaseVisuals";

type Step = {
  id: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    id: "reported",
    title: "Reported",
    description: "The farmer sends a voice note and a photo on WhatsApp.",
  },
  {
    id: "triaged",
    title: "Triaged",
    description: "V-Vet asks how long, whether it's getting worse, and whether it has happened before.",
  },
  {
    id: "with-vet",
    title: "With a vet",
    description: "High-risk cases reach a vet with symptoms, media and the animal's history.",
  },
  {
    id: "followed-up",
    title: "Followed up",
    description: "V-Vet checks back and records whether the animal recovered.",
  },
];

const AUTO_ADVANCE_MS = 4500;

function StepPanel({ stepId }: { stepId: string }) {
  if (stepId === "reported") {
    return (
      <div className="space-y-3">
        <VoiceNoteBubble />
        <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 text-sm text-landing-ink ring-1 ring-black/5">
          <ImageIcon size={16} className="text-landing-muted" aria-hidden="true" />
          1 photo attached
        </div>
      </div>
    );
  }

  if (stepId === "triaged") {
    return (
      <div className="space-y-4">
        <TierPills activeIndex={2} />
        <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-landing-ink ring-1 ring-black/5">
          <p className="font-semibold">Why this was flagged</p>
          <p className="mt-1 text-landing-muted">
            Not eating for 2 days, weakness, getting worse. A vet should see this case today.
          </p>
          <p className="mt-3 text-xs font-medium text-landing-muted">
            Confidence: moderate. Each alert says how sure V-Vet is.
          </p>
        </div>
      </div>
    );
  }

  if (stepId === "with-vet") {
    return <VetCaseCard />;
  }

  return <FollowUpThread />;
}

export default function TriageDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isAutoPlaying || prefersReducedMotion) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % STEPS.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isAutoPlaying, prefersReducedMotion]);

  function selectStep(index: number) {
    setIsAutoPlaying(false);
    setActiveIndex(index);
  }

  const activeStep = STEPS[activeIndex];

  return (
    <div className="grid gap-6 rounded-[28px] bg-landing-paper p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10 md:p-10">
      <div role="tablist" aria-label="Example case steps" className="flex flex-col gap-1.5">
        {STEPS.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              id={`triage-tab-${step.id}`}
              aria-selected={isActive}
              aria-controls="triage-panel"
              onClick={() => selectStep(index)}
              className={
                isActive
                  ? "group relative overflow-hidden rounded-2xl bg-white px-5 py-4 text-left shadow-[0_8px_24px_-14px_rgba(17,33,17,0.3)] ring-1 ring-black/5 transition-colors"
                  : "group relative rounded-2xl px-5 py-4 text-left transition-colors hover:bg-white/60"
              }
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    isActive
                      ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-button text-xs font-semibold text-white"
                      : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-landing-muted ring-1 ring-landing-line"
                  }
                >
                  {index + 1}
                </span>
                <span className="text-base font-semibold text-landing-ink">{step.title}</span>
              </span>
              <span
                className={
                  isActive
                    ? "mt-1.5 block pl-10 text-sm leading-relaxed text-landing-muted"
                    : "mt-1.5 hidden pl-10 text-sm leading-relaxed text-landing-muted sm:block"
                }
              >
                {step.description}
              </span>
              {isActive && isAutoPlaying && !prefersReducedMotion && (
                <motion.span
                  key={`progress-${activeIndex}`}
                  className="absolute bottom-0 left-0 h-[3px] bg-landing-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        id="triage-panel"
        role="tabpanel"
        aria-labelledby={`triage-tab-${activeStep.id}`}
        className="relative flex min-h-[300px] flex-col justify-center rounded-[22px] bg-landing-mint p-5 sm:p-8"
      >
        <span className="absolute right-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-landing-muted">
          Example case
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeStep.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-sm pt-6"
          >
            <StepPanel stepId={activeStep.id} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
