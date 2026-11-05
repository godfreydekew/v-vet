import { Trophy } from "lucide-react";

// Official logo files go in src/assets/awards/, named by the award's logoKey
// (nvidia, henley, reading) as .svg, .png or .webp. Until a file is added,
// every place that shows a logo falls back to the organisation's name or a trophy.
const LOGO_FILES = import.meta.glob("/src/assets/awards/*.{svg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

type Award = {
  // The name people recognise, set large.
  organisation: string;
  logoKey: string;
  competition: string;
  position: string;
  about: string;
  tileClass: string;
};

export const AWARDS: Award[] = [
  {
    organisation: "NVIDIA",
    logoKey: "nvidia",
    competition: "NVIDIA AI Day Competition",
    position: "Winner",
    about:
      "An AI competition sponsored by NVIDIA, Henley Business School, SCG and Softcat. V-Vet took the top prize.",
    tileClass: "bg-landing-mint",
  },
  {
    organisation: "Henley Business School",
    logoKey: "henley",
    competition: "IDEAFEST 2026 Business Idea Competition",
    position: "Category winner",
    about:
      "Henley Business School's annual business idea competition, run by the Henley Enterprise Lab. V-Vet was recognised as an AI-powered livestock health platform for smallholder farmers.",
    tileClass: "bg-landing-sky",
  },
  {
    organisation: "University of Reading",
    logoKey: "reading",
    competition: "Just Imagine If 2026",
    position: "Winner",
    about:
      "A business development award marking the University of Reading's centenary. Finalists presented their business plans to a judging panel, and the winners received seed funding, which is funding V-Vet's first pilot.",
    tileClass: "bg-landing-sand",
  },
];

export function getAwardLogo(logoKey: string): string | undefined {
  return Object.entries(LOGO_FILES).find(([path]) => path.includes(`/awards/${logoKey}.`))?.[1];
}

// An award's logo at a given height, in full colour. Logos have white backgrounds and must not
// be recoloured, so place them on white. Falls back to a trophy if the file is missing.
export function AwardMark({ award, className = "h-5" }: { award: Award; className?: string }) {
  const logo = getAwardLogo(award.logoKey);
  if (!logo) {
    return <Trophy className={`${className} w-auto shrink-0`} strokeWidth={1.75} aria-hidden="true" />;
  }
  return <img src={logo} alt={award.organisation} className={`${className} w-auto shrink-0 object-contain`} />;
}

export function AwardList() {
  return (
    <ul className="space-y-3">
      {AWARDS.map((award) => (
        <li
          key={award.competition}
          className={`grid items-center gap-5 rounded-[28px] p-5 sm:p-6 md:grid-cols-[280px_1fr] md:gap-10 ${award.tileClass}`}
        >
          <div className="flex h-full flex-col justify-center rounded-[20px] bg-white px-6 py-6 sm:px-8">
            <AwardMark award={award} className="mx-auto h-12 max-w-full sm:h-14" />
          </div>
          <div className="flex flex-col py-1 md:pr-4">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-landing-ink ring-1 ring-black/5">
              <Trophy size={15} className="fill-[#F2C744] text-[#B8860B]" aria-hidden="true" />
              {award.position}
            </p>
            <h3 className="mt-3 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink">
              {award.competition}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-ink/80">{award.about}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
