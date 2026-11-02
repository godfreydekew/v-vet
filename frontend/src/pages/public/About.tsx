import { Link } from "react-router-dom";
import { ArrowRight, Bug, Clock, Mail, MapPin } from "lucide-react";
import { AWARDS, AwardMark } from "@/components/landing/Awards";
import heroImage from "@/assets/problem-farmer-check.webp";
import {
  Accent,
  ClosingBand,
  PARTNER_MAILTO,
  PageHero,
  PublicPage,
  balance,
  pillPrimaryOnDark,
  pillSecondary,
  pillSecondaryOnDark,
  sectionHeading,
} from "@/components/landing/Site";

const PROBLEM_FACTS = [
  {
    figure: "60 to 67%",
    icon: Bug,
    text: "of livestock deaths in Zimbabwe are caused by tick-borne diseases.",
    tileClass: "bg-landing-rose",
  },
  {
    figure: "24 to 48 hours",
    icon: Clock,
    text: "is all it can take for January Disease to kill an animal once a fever sets in.",
    tileClass: "bg-landing-sand",
  },
  {
    figure: "Hours away",
    icon: MapPin,
    text: "is how far the nearest vet can be for many farmers, so an illness that could be treated ends in a lost animal.",
    tileClass: "bg-landing-sky",
  },
];

const BELIEFS = [
  {
    title: "Help people decide",
    text: "Everything we build should help someone save an animal or protect their income. Good records are how we make that easier.",
  },
  {
    title: "Go where farmers already are",
    text: "Farmers already use WhatsApp, so that's where V-Vet lives. They can write or talk in their own language, with as little typing as possible.",
  },
  {
    title: "Explain the reasoning",
    text: "When V-Vet flags something, it says why, and how confident it is.",
  },
  {
    title: "Catch problems early",
    text: "Reminders for dipping, vaccination and deworming help keep animals healthy in the first place.",
  },
  {
    title: "Make vets' time go further",
    text: "Cases reach vets sorted by urgency, with the animal's history attached, so each vet can help more farmers.",
  },
  {
    title: "Build it with the people who use it",
    text: "We test V-Vet with farmers and vets, and change it based on what they tell us.",
  },
];

const ENGINE_PATH = [
  { question: "Froth from the nose?", answer: "No" },
  { question: "Lumps below the ear?", answer: "Yes" },
  { question: "Does the animal feel hot?", answer: "Not sure" },
];

function ProblemSection() {
  return (
    <section className="px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="max-w-[720px]">
          <h2 className={sectionHeading} style={balance}>
            Too many animals die of <Accent>things we can catch early</Accent>
          </h2>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-landing-muted">
            For millions of smallholder farmers, livestock are savings, income and food security.
            When an animal falls sick, the farmer often has to decide alone what to do, and by the
            time a vet arrives it can be too late.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {PROBLEM_FACTS.map((fact) => (
            <li key={fact.figure} className={`rounded-[24px] p-7 ${fact.tileClass}`}>
              <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-white text-landing-ink ring-1 ring-black/5">
                <fact.icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="font-display text-[2.5rem] font-semibold leading-none tracking-[-0.02em] text-landing-ink">
                {fact.figure}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-landing-ink">{fact.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StartedSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 rounded-[28px] bg-landing-paper p-6 sm:p-10 md:grid-cols-[7fr_5fr] md:p-14">
        <div>
          <h2 className={sectionHeading} style={balance}>
            Where we <Accent>started</Accent>
          </h2>
          <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            V-Vet started with a simple question: what if a farmer could get veterinary guidance as
            easily as sending a WhatsApp message? We took the idea to competitions at Henley Business
            School and the University of Reading, built a working product on WhatsApp, and won the
            funding for our first pilot.
          </p>
          <Link to="/journey" className={`${pillSecondary} mt-8 bg-white`}>
            Follow our journey
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ul className="space-y-3">
          {["The idea", "Recognised by three competitions", "A working product on WhatsApp", "A funded pilot"].map(
            (step, index) => (
              <li key={step} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-pine text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-[15px] font-medium text-landing-ink">{step}</span>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}

function BeliefsSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            What we <Accent>believe</Accent>
          </h2>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BELIEFS.map((belief, index) => (
            <li
              key={belief.title}
              className={`rounded-[24px] p-7 ${["bg-landing-mint", "bg-landing-sky", "bg-landing-sand", "bg-landing-rose", "bg-landing-sand", "bg-landing-mint"][index]}`}
            >
              <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">{belief.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-landing-ink/80">{belief.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BelieversSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            Who <Accent>believes in us</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            Three competitions have backed V-Vet so far. The most recent is funding our first pilot
            with farmers.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {AWARDS.map((award) => (
            <li key={award.competition} className={`flex flex-col rounded-[24px] p-7 ${award.tileClass}`}>
              <span className="flex h-24 items-center justify-center rounded-2xl bg-white px-4">
                <AwardMark award={award} className="h-14 max-w-full" />
              </span>
              <p className="mt-5 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink">
                {award.organisation}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-landing-ink/80">{award.competition}</p>
              <p className="mt-4 text-sm font-semibold text-landing-pine">{award.position}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link to="/journey#awards" className={pillSecondary}>
            Read about our awards
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BuildingNowSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-14 md:grid-cols-[6fr_5fr] md:gap-16">
        <div>
          <h2 className={sectionHeading} style={balance}>
            Now: a triage engine <Accent>built with vets</Accent>
          </h2>
          <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            We're turning vet-written knowledge into a decision engine for livestock disease,
            starting with January Disease (theileriosis) in cattle. Vets wrote the signs, the
            questions and the rules for when to escalate. The engine asks farmers the right
            questions in plain language and works out how urgently a vet is needed.
          </p>
          <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            Vets approve every change to the engine, and every decision can be traced back to the
            rule that made it.
          </p>
        </div>
        <div className="relative rounded-[28px] bg-landing-sky p-6 sm:p-10">
          <ol className="space-y-2.5">
            {ENGINE_PATH.map((step) => (
              <li
                key={step.question}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 font-app text-sm text-app-ink shadow-[0_10px_30px_-14px_rgba(17,33,17,0.3)] ring-1 ring-app-line"
              >
                {step.question}
                <span className="shrink-0 rounded-md bg-app-bg px-2 py-0.5 text-xs font-semibold text-app-muted">
                  {step.answer}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl bg-white p-4 font-app shadow-[0_10px_30px_-14px_rgba(17,33,17,0.3)] ring-1 ring-app-line">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              Vet within 12 hours
            </span>
            <p className="mt-2 text-[13px] leading-snug text-app-ink">
              These signs may point to January Disease. Rule applied: lumps with a possible fever,
              escalate early.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <PublicPage>
      <PageHero
        title={
          <>
            Built for the farmers <span className="text-landing-leaf">who feed Zimbabwe</span>
          </>
        }
        lead="V-Vet helps smallholder farmers look after their animals through WhatsApp, in their own language, and gets them to a vet when it matters."
        image={heroImage}
        imagePosition="50% 30%"
      />
      <ProblemSection />
      <StartedSection />
      <BeliefsSection />
      <BelieversSection />
      <BuildingNowSection />
      <ClosingBand
        title={
          <>
            Help us build <span className="text-landing-leaf">what comes next</span>
          </>
        }
        lead="We're looking for partners to take V-Vet to more farmers, and engineers to help build it."
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
