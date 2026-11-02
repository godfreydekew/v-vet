import { ArrowUpRight } from "lucide-react";

type Award = {
  // The name people recognise, set large.
  organisation: string;
  competition: string;
  position: string;
  about: string;
  link?: string;
  tileClass: string;
};

export const AWARDS: Award[] = [
  {
    organisation: "NVIDIA",
    competition: "NVIDIA AI Day Competition",
    position: "Winner",
    about:
      "An AI competition sponsored by NVIDIA, Henley Business School, SCG and Softcat. V-Vet took the top prize.",
    tileClass: "bg-landing-mint",
  },
  {
    organisation: "Henley Business School",
    competition: "IDEAFEST 2026 Business Idea Competition",
    position: "Category winner, Best Idea for China",
    about:
      "Henley Business School's annual business idea competition, run by the Henley Enterprise Lab. V-Vet was recognised as an AI-powered livestock health platform for smallholder farmers.",
    link: "https://live.henley.ac.uk/news/13206940",
    tileClass: "bg-landing-sky",
  },
  {
    organisation: "University of Reading",
    competition: "Just Imagine If 2026",
    position: "Winner",
    about:
      "A business development award marking the University of Reading's centenary. Finalists presented their business plans to a judging panel, and the winners received seed funding, which is funding V-Vet's first pilot.",
    link: "https://www.reading.ac.uk/just-imagine-if/2026-winners",
    tileClass: "bg-landing-sand",
  },
];

export function AwardList() {
  return (
    <ul className="space-y-4">
      {AWARDS.map((award) => (
        <li
          key={award.competition}
          className={`grid gap-6 rounded-[28px] p-7 sm:p-10 md:grid-cols-[5fr_6fr] md:gap-12 ${award.tileClass}`}
        >
          <div>
            <p className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-landing-ink sm:text-5xl">
              {award.organisation}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-landing-pine ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-landing-accent" aria-hidden="true" />
              {award.position}
            </p>
          </div>
          <div className="flex flex-col">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
              {award.competition}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-ink/80">{award.about}</p>
            {award.link && (
              <a
                href={award.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-fit items-center gap-1 text-[15px] font-semibold text-landing-pine hover:text-landing-forest"
              >
                Read more
                <span className="sr-only"> about {award.competition} (opens in a new tab)</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
