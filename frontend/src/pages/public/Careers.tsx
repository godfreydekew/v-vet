import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ROLES } from "@/data/careers";
import heroImage from "@/assets/help-farmer-phone.webp";
import HiringSteps from "@/components/landing/HiringSteps";
import { Accent, PageHero, PublicPage, balance, pillPrimaryOnDark, sectionHeading } from "@/components/landing/Site";

const REASONS = [
  {
    title: "Work that keeps animals alive",
    text: "What you build reaches farmers whose livestock are their savings and income.",
    tileClass: "bg-landing-mint",
  },
  {
    title: "Interesting problems",
    text: "LLMs, WhatsApp conversations in three languages, and a triage engine built with vets.",
    tileClass: "bg-landing-sky",
  },
  {
    title: "Remote, within Zimbabwe",
    text: "Work from where you are, close to the farmers and vets you're building for.",
    tileClass: "bg-landing-sand",
  },
];

export default function Careers() {
  return (
    <PublicPage>
      <PageHero
        title={
          <>
            Build technology <span className="text-landing-leaf">for Zimbabwe's farmers</span>
          </>
        }
        lead="We're a small team building livestock decision support on WhatsApp. If you want your work to help farmers keep their animals alive, we'd like to hear from you."
        image={heroImage}
        imagePosition="50% 25%"
      >
        <a href="#roles" className={pillPrimaryOnDark}>
          See open roles
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </PageHero>

      <section className="px-4 py-24 sm:px-6 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <h2 className={sectionHeading} style={balance}>
            Why work <Accent>with us</Accent>
          </h2>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {REASONS.map((reason) => (
              <li key={reason.title} className={`rounded-[24px] p-7 ${reason.tileClass}`}>
                <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">{reason.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-landing-ink/80">{reason.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="roles" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
        <div className="mx-auto max-w-[1100px]">
          <h2 className={sectionHeading} style={balance}>
            Open <Accent>roles</Accent>
          </h2>
          <ul className="mt-12 space-y-4">
            {ROLES.map((role) => (
              <li key={role.id}>
                <Link
                  to={`/careers/${role.id}`}
                  className="group flex flex-col gap-5 rounded-[28px] bg-landing-mint p-7 transition-colors hover:bg-[#d2e7d6] sm:p-10 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink">
                      {role.title}
                    </h3>
                    <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-landing-ink/80">{role.summary}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {role.terms.map((term) => (
                        <li key={term} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-landing-ink ring-1 ring-black/5">
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold text-landing-pine">
                    View role and apply
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 md:pb-32">
        <div className="mx-auto max-w-[1100px]">
          <h2 className={sectionHeading} style={balance}>
            How we <Accent>hire</Accent>
          </h2>
          <div className="mt-12">
            <HiringSteps />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
