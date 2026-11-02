import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import heroImage from "@/assets/landing-hero.webp";
import {
  Accent,
  ClosingBand,
  PARTNER_MAILTO,
  PageHero,
  PublicPage,
  balance,
  pillPrimaryOnDark,
  pillSecondaryOnDark,
  sectionHeading,
} from "@/components/landing/Site";

type Stage = "done" | "now" | "next";

type Milestone = {
  when: string;
  title: string;
  text: string;
  stage: Stage;
};

// Newest last. Keep dates to what we can back up.
const MILESTONES: Milestone[] = [
  {
    when: "Where it began",
    title: "The idea",
    text: "Smallholder farmers lose animals they could have saved, often because help arrives too late. We asked what would change if veterinary guidance was one WhatsApp message away.",
    stage: "done",
  },
  {
    when: "May 2026",
    title: "Recognised at Henley Business School",
    text: "V-Vet won the Best Idea for China category at IDEAFEST 2026, Henley Business School's business idea competition.",
    stage: "done",
  },
  {
    when: "2026",
    title: "Winner of the NVIDIA AI Day Competition",
    text: "V-Vet won the NVIDIA AI Day Competition, sponsored by NVIDIA, Henley Business School, SCG and Softcat.",
    stage: "done",
  },
  {
    when: "2026",
    title: "A working product on WhatsApp",
    text: "Farmers can register animals, record births and report sickness inside WhatsApp, in Shona, Ndebele or English. Vets get prioritised cases with each animal's history in a web dashboard.",
    stage: "done",
  },
  {
    when: "September 2026",
    title: "Just Imagine If 2026 winner, and a funded pilot",
    text: "V-Vet was one of the winners of the University of Reading's Just Imagine If award. The seed funding is paying for our first pilot with farmers.",
    stage: "done",
  },
  {
    when: "Now",
    title: "Building the triage engine with vets",
    text: "We're turning vet-written knowledge into a decision engine, starting with January Disease in cattle. Vets approve every change, and every decision can be traced back to its rule.",
    stage: "now",
  },
  {
    when: "Next",
    title: "Our first pilot in Zimbabwe",
    text: "We'll work with farmers and vets on the ground to test V-Vet with real cases, and use what we learn to improve it.",
    stage: "next",
  },
];

const STAGE_STYLES: Record<Stage, { dot: string; chip: string; label: string }> = {
  done: { dot: "bg-landing-pine", chip: "bg-landing-paper text-landing-muted", label: "" },
  now: { dot: "bg-landing-pine ring-4 ring-landing-mint", chip: "bg-landing-mint text-landing-pine", label: "In progress" },
  next: { dot: "bg-white ring-2 ring-inset ring-landing-line", chip: "bg-landing-sky text-landing-ink", label: "Coming up" },
};

function Timeline() {
  return (
    <section className="px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-[760px]">
        <h2 className={sectionHeading} style={balance}>
          The story <Accent>so far</Accent>
        </h2>
        <ol className="relative mt-12 space-y-10 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-landing-line">
          {MILESTONES.map((milestone) => {
            const style = STAGE_STYLES[milestone.stage];
            return (
              <li key={milestone.title} className="relative pl-12">
                <span className={`absolute left-0 top-1.5 h-[19px] w-[19px] rounded-full ${style.dot}`} aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-landing-muted">{milestone.when}</p>
                  {style.label && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.chip}`}>{style.label}</span>
                  )}
                </div>
                <h3 className="mt-1 font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
                  {milestone.title}
                </h3>
                <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-landing-muted">{milestone.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default function Journey() {
  return (
    <PublicPage>
      <PageHero
        title={
          <>
            From an idea <span className="text-landing-leaf">to a funded pilot</span>
          </>
        }
        lead="How V-Vet went from a question about farmers and WhatsApp to a working product, three awards and our first pilot."
        image={heroImage}
        imagePosition="50% 25%"
      />
      <Timeline />
      <ClosingBand
        title={
          <>
            Be part of <span className="text-landing-leaf">the next chapter</span>
          </>
        }
        lead="Our first pilot in Zimbabwe is funded and we're getting it ready. Come and partner with us, or join the team building it."
      >
        <a href={PARTNER_MAILTO} className={pillPrimaryOnDark}>
          <Mail size={16} aria-hidden="true" />
          Partner with us
        </a>
        <Link to="/careers" className={pillSecondaryOnDark}>
          See open roles
        </Link>
      </ClosingBand>
    </PublicPage>
  );
}
