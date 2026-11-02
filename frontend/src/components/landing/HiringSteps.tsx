import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HIRING_STEPS } from "@/data/careers";

// applyTo adds an "Apply now" link to the first step, for pages about a single role.
export default function HiringSteps({ applyTo }: { applyTo?: string }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {HIRING_STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col rounded-[24px] bg-landing-paper p-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-landing-pine text-sm font-semibold text-white">
            {index + 1}
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold text-landing-ink">{step.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">{step.text}</p>
          {applyTo && index === 0 && (
            <Link
              to={applyTo}
              className="mt-4 inline-flex w-fit items-center gap-1 text-[15px] font-semibold text-landing-pine hover:text-landing-forest"
            >
              Apply now
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}
