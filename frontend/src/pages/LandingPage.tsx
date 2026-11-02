import { Link } from "react-router-dom";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import {
  ArrowRight,
  HeartPulse,
  Play,
  TrendingDown,
  Wallet,
  Languages,
  LogIn,
  Mail,
  Mic,
  Smartphone,
  Stethoscope,
  History,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import farmerCheckImage from "@/assets/problem-farmer-check.webp";
import farmerPhoneImage from "@/assets/help-farmer-phone.webp";
import farmerImage from "@/assets/landing-hero.jpg";
import whatsappScreenshot from "@/assets/whatsapp-screenshot.jpg";
import TriageDemo from "@/components/landing/TriageDemo";
import {
  ExampleChip,
  HeroCasePanel,
  RegistrationForm,
  ReportThread,
  VetQueue,
} from "@/components/landing/CaseVisuals";
import { AWARDS, AwardList, AwardMark } from "@/components/landing/Awards";
import WhatsAppIcon from "@/components/landing/WhatsAppIcon";
import {
  Accent,
  CheckList,
  ClosingBand,
  GreenGround,
  PARTNER_EMAIL,
  PARTNER_MAILTO,
  PublicPage,
  WHATSAPP_LINK,
  balance,
  pillPrimary,
  pillPrimaryOnDark,
  pillSecondary,
  pillSecondaryOnDark,
  sectionHeading,
} from "@/components/landing/Site";

const TRUST_MARQUEE = [
  { icon: Languages, label: "Shona, Ndebele and English" },
  { icon: Mic, label: "Voice notes, photos or text" },
  { icon: Smartphone, label: "Works on WhatsApp" },
  { icon: Stethoscope, label: "Vets review urgent cases" },
  { icon: History, label: "A record for every animal" },
  { icon: ShieldCheck, label: "Every alert says why" },
];

const LOSSES = [
  { icon: HeartPulse, figure: "60%+", label: "of cattle deaths in Zimbabwe are from tick-borne diseases" },
  { icon: TrendingDown, figure: "15,328", label: "cattle lost to tick-borne diseases, 2014 to 2020" },
  { icon: Wallet, figure: "US$1,289", label: "lost per farmer over two years in one district study" },
];

const HOW_VVET_HELPS = [
  "Recognise potential livestock health problems",
  "Access AI-assisted guidance",
  "Understand when veterinary attention is needed",
];

const VET_GETS = [
  "Cases sorted by urgency",
  "Symptoms, photos and voice notes in one place",
  "The animal's record: births, treatments and past cases",
  "A way to send the diagnosis, treatment plan and follow-up date back to the farmer",
];

function HeroAwards() {
  return (
    <a href="#awards" className="group mx-auto flex w-fit flex-col items-center gap-3">
      <span className="text-sm font-medium text-white/75 transition-colors group-hover:text-white">
        Award winner at
      </span>
      <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-[18px] bg-white px-3 py-2.5 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.5)] sm:rounded-full sm:px-5">
        {AWARDS.map((award, index) => (
          <li key={award.competition} className="flex items-center">
            {index > 0 && <span className="mx-3 h-7 w-px bg-landing-line sm:mx-4" aria-hidden="true" />}
            <AwardMark award={award} className="h-8 max-w-[120px] sm:h-9" />
          </li>
        ))}
      </ul>
    </a>
  );
}

function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const entrance = (delay: number): MotionProps =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <GreenGround image={farmerImage} imagePosition="50% 22%">
      <section id="top" className="relative mx-auto flow-root max-w-[1160px] px-4 pb-10 pt-28 text-center sm:px-6 md:pb-[72px] md:pt-[132px]">
        <motion.h1
          {...entrance(0)}
          className="mx-auto max-w-[24ch] font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl md:text-[4.25rem]"
          style={balance}
        >
          Animal health, <br className="hidden sm:block" />
          <span className="text-landing-leaf">one WhatsApp message</span> away.
        </motion.h1>

        <motion.p
          {...entrance(0.08)}
          className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-white/85 md:text-lg"
          style={{ textWrap: "pretty" } as React.CSSProperties}
        >
          Farmers tell V-Vet what's wrong with an animal on WhatsApp, in Shona, Ndebele or English.
          V-Vet works out how serious it is and brings in a vet when one is needed.
        </motion.p>

        <motion.div
          {...entrance(0.16)}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href={PARTNER_MAILTO} className={pillPrimaryOnDark}>
            Partner with us
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={pillSecondaryOnDark}>
            <WhatsAppIcon size={16} />
            Start on WhatsApp
          </a>
        </motion.div>

        <motion.div {...entrance(0.22)} className="mt-10">
          <HeroAwards />
        </motion.div>

        <motion.div {...entrance(0.3)} className="mx-auto mt-10 max-w-[1000px] md:mt-14">
          <HeroCasePanel />
        </motion.div>
      </section>
    </GreenGround>
  );
}

function TrustMarquee() {
  const doubled = [...TRUST_MARQUEE, ...TRUST_MARQUEE];
  return (
    <div className="group overflow-hidden border-b border-landing-line py-7">
      <ul className="flex w-max animate-marquee gap-14 group-hover:[animation-play-state:paused]">
        {doubled.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            aria-hidden={index >= TRUST_MARQUEE.length}
            className="flex items-center gap-2.5 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-landing-ink"
          >
            <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemCollage() {
  return (
    <div className="relative pb-8 pt-8">
      <div className="absolute inset-y-0 left-[30%] right-0 rounded-[28px] bg-landing-rose" aria-hidden="true" />
      <figure className="relative h-[400px] w-[72%] overflow-hidden rounded-[24px] shadow-[0_30px_50px_-24px_rgba(17,33,17,0.5)] sm:h-[470px]">
        <img
          src={farmerCheckImage}
          alt="A farmer crouching in a kraal, checking the neck of a cow with a concerned expression"
          className="h-full w-full object-cover object-[50%_30%]"
        />
        <figcaption className="absolute bottom-3 left-3">
          {/* <ExampleChip label="Illustrative photo" /> */}
        </figcaption>
      </figure>
      <ul className="absolute bottom-10 right-2 w-[56%] space-y-2.5 sm:right-4 sm:w-[50%]">
        {LOSSES.map((loss) => (
          <li
            key={loss.label}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 text-landing-ink shadow-[0_16px_40px_-18px_rgba(17,33,17,0.45)] ring-1 ring-black/5 sm:p-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-landing-rose sm:h-10 sm:w-10">
              <loss.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-semibold leading-none tracking-[-0.01em] sm:text-[1.375rem]">
                {loss.figure}
              </span>
              <span className="mt-1 block text-xs leading-snug text-landing-muted sm:text-[13px]">{loss.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HelpCollage() {
  return (
    <div className="relative pb-8 pt-8">
      <div className="absolute inset-y-0 left-[30%] right-0 rounded-[28px] bg-landing-mint" aria-hidden="true" />
      <span className="absolute right-4 top-4">
        <ExampleChip label="Example case" />
      </span>
      <figure className="relative h-[400px] w-[72%] overflow-hidden rounded-[24px] shadow-[0_30px_50px_-24px_rgba(17,33,17,0.5)] sm:h-[470px]">
        <img
          src={farmerPhoneImage}
          alt="A farmer outdoors recording a message on a smartphone, with cattle grazing behind"
          className="h-full w-full object-cover object-[45%_25%]"
        />
        <figcaption className="absolute bottom-3 left-3">
          <ExampleChip label="Illustrative photo" />
        </figcaption>
      </figure>
      <div className="absolute bottom-14 right-3 w-[52%] space-y-2.5 sm:right-5 sm:w-[48%]">
        <div className="rounded-2xl rounded-tr-md bg-[#D9FDD3] p-3 text-[13px] leading-snug text-landing-ink shadow-[0_16px_40px_-18px_rgba(17,33,17,0.45)]">
          <div className="mb-1.5 flex items-center gap-1.5" aria-hidden="true">
            <Play size={11} fill="currentColor" className="text-landing-pine" />
            <span className="h-[3px] flex-1 rounded-full bg-landing-ink/25" />
            <span className="text-xs text-[#4A5F4A]">0:23</span>
          </div>
          “My cow Shumba has not eaten since yesterday.”
        </div>
        <div className="rounded-2xl rounded-tl-md bg-white p-3 shadow-[0_16px_40px_-18px_rgba(17,33,17,0.45)] ring-1 ring-black/5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden="true" />
            High risk
          </span>
          <p className="mt-2 text-[13px] font-medium leading-snug text-landing-ink">
            A vet should see this case today.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="overflow-hidden px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-[1100px] space-y-24 md:space-y-32">
        <div className="relative grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div
            className="pointer-events-none absolute -right-32 -top-24 h-[560px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(242,230,236,0.9),rgba(242,230,236,0))]"
            aria-hidden="true"
          />
          <div className="relative">
            {/* <p className="text-[15px] font-semibold text-landing-muted">The problem</p> */}
            <h2 className={`${sectionHeading} mt-4`} style={balance}>
              Farmers are losing animals <Accent>they could have saved</Accent>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
              When an animal gets sick, most smallholder farmers have to work out what to do on
              their own, and the nearest vet can be hours or days away. Animals die, herds produce
              less, and families lose income they depend on.
            </p>
            <p className="mt-6 max-w-[52ch] text-xs leading-relaxed text-landing-muted">
              Sources: Zimbabwe's national tick-borne disease strategy, as reported by{" "}
              <a
                href="https://www.newsday.co.zw/business/article/6521/tick-borne-scourge-kills-15-300-cattle"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-landing-line underline-offset-2 hover:decoration-landing-ink"
              >
                NewsDay
              </a>
              , and a 2023 study of farmers in Mutare district in{" "}
              <a
                href="https://doaj.org/article/81104f65874e4f77b86831e488e94026"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-landing-line underline-offset-2 hover:decoration-landing-ink"
              >
                Cogent Food &amp; Agriculture
              </a>
              .
            </p>
          </div>
          <div className="relative">
            <ProblemCollage />
          </div>
        </div>
{/* 
        <div className="relative grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div
            className="pointer-events-none absolute -left-32 -top-24 h-[560px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(222,237,224,0.8),rgba(222,237,224,0))]"
            aria-hidden="true"
          />
          <div className="relative md:order-last">
            <p className="text-[15px] font-semibold text-landing-pine">How V-Vet helps</p>
            <h2 className={`${sectionHeading} mt-4`} style={balance}>
              Better livestock health starts with <Accent>better access to guidance.</Accent>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
              V-Vet helps smallholder farmers recognise potential livestock health problems, access
              AI-assisted guidance, and understand when veterinary attention is needed. Through
              WhatsApp-based support and animal health records, V-Vet aims to help farmers make more
              informed decisions about their herds.
            </p>
            <div className="mt-7 hidden md:block">
              <CheckList items={HOW_VVET_HELPS} />
            </div>
          </div>
          <div className="relative">
            <HelpCollage />
          </div>
        </div> */}
      </div>
    </section>
  );
}

const HOW_IT_WORKS = [
  {
    title: "Say hello on WhatsApp",
    text: "Scan the code or send us a message. Your phone number is your account.",
    tileClass: "bg-landing-mint items-end pb-0",
    visual: (
      <div className="w-[210px] rounded-t-[34px] bg-[#111] p-2 pb-0 shadow-[0_30px_50px_-24px_rgba(17,33,17,0.6)]">
        <img
          src={whatsappScreenshot}
          alt="The V-Vet welcome message in WhatsApp, inviting the farmer to set up their farm"
          className="h-[250px] w-full rounded-t-[26px] object-cover object-top"
        />
      </div>
    ),
  },
  {
    title: "Register your animals",
    text: "A short WhatsApp form takes each animal's details in one go, and every animal gets its own tag and record.",
    tileClass: "bg-landing-sky items-center",
    visual: <RegistrationForm />,
  },
  {
    title: "Tell us when something's wrong",
    text: "Send a text, a voice note or a photo, in Shona, Ndebele or English.",
    tileClass: "bg-landing-sand items-center",
    visual: <ReportThread />,
  },
];

function FarmersSection() {
  return (
    <section id="farmers" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            How it works <Accent>for farmers</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            Everything happens in WhatsApp, which most farmers already have on their phones.
          </p>
        </div>

        <ol className="mt-14 grid gap-x-5 gap-y-12 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="flex flex-col">
              <div
                className={`flex h-[330px] justify-center overflow-hidden rounded-[24px] px-5 pt-8 ${step.tileClass}`}
              >
                {step.visual}
              </div>
              <h3 className="mt-6 flex items-center gap-3 font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-landing-ink text-sm font-semibold text-white">
                  {index + 1}
                </span>
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={pillPrimary}>
            <WhatsAppIcon size={16} />
            Start on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function TriageSection() {
  return (
    <section id="triage" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            What happens <Accent>after a report</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-[17px] leading-relaxed text-landing-muted">
            V&#8209;Vet looks at the symptoms, how long they've lasted and whether the animal is getting
            worse. Then it gives advice and checks back later, asks a few more questions, or sends
            the case to a vet.
          </p>
        </div>
        <div className="mt-14">
          <TriageDemo />
        </div>
      </div>
    </section>
  );
}

function VetsSection() {
  return (
    <section id="vets" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-14 md:grid-cols-[6fr_5fr] md:gap-16">
        <div>
          <h2 className={sectionHeading} style={balance}>
            Vets get <Accent>the whole story</Accent>
          </h2>
          <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            Each case arrives with the farmer's messages, photos and the animal's history, so a vet
            can decide quickly and help more farmers in a day.
          </p>
          <div className="mt-8">
            <CheckList items={VET_GETS} />
          </div>
        </div>
        <div className="relative rounded-[28px] bg-landing-rose p-6 sm:p-10">
          <VetQueue />
        </div>
      </div>
    </section>
  );
}

function GroundworkSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] gap-4 md:grid-cols-2">
        <article className="flex flex-col overflow-hidden rounded-[24px] bg-landing-paper sm:flex-row">
          <div className="flex items-center justify-center bg-landing-mint p-6 sm:w-[42%]">
            <ul className="w-full max-w-[180px] space-y-2 font-chat text-[13.5px] text-wa-ink">
              {["Dipping", "Deworming", "Vaccination"].map((task, index) => (
                <li
                  key={task}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-black/5"
                >
                  {task}
                  <span className="text-xs text-wa-meta">{["Fri", "2 wks", "Mar"][index]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-6 sm:p-7">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
              Reminders <Accent>before things are due</Accent>
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">
              Farmers get reminders for vaccination, dipping, deworming, weaning and bull soundness,
              so routine care happens on time.
            </p>
          </div>
        </article>

        <article className="flex flex-col overflow-hidden rounded-[24px] bg-landing-paper sm:flex-row">
          <div className="flex items-center justify-center bg-landing-sand p-6 sm:w-[42%]">
            <ul className="w-full max-w-[180px] space-y-2 font-app text-sm text-app-ink">
              {["Breeding", "Calving", "Herd insights"].map((topic) => (
                <li
                  key={topic}
                  className="rounded-xl bg-white px-3 py-2 text-landing-ink ring-1 ring-black/5"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-6 sm:p-7">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
              Help with <Accent>breeding and calving</Accent>
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">
              Advice on breeding, getting ready for calving and running the herd, based on each
              farmer's own records.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function AwardsSection() {
  return (
    <section id="awards" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            Our <Accent>awards</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            We've won three competitions so far. The latest is paying for our first pilot with
            farmers in Zimbabwe.
          </p>
        </div>

        <div className="mt-14">
          <AwardList />
        </div>

        <div className="mt-10 text-center">
          <Link to="/journey" className={pillSecondary}>
            See our journey so far
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function StartSection() {
  return (
    <section id="start" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 rounded-[28px] bg-landing-paper p-6 sm:p-10 md:grid-cols-[7fr_5fr] md:p-14">
        <div>
          <h2 className={sectionHeading} style={balance}>
            Try V-Vet <Accent>on WhatsApp</Accent>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
            Scan the code or tap the button to say hello. Your phone number is your account. If
            you've already registered, you can also sign in to the web app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={pillPrimary}>
              <WhatsAppIcon size={16} />
              Chat on WhatsApp
            </a>
            <Link to="/login" className={pillSecondary}>
              <LogIn size={16} aria-hidden="true" />
              Sign in
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm text-landing-muted ring-1 ring-landing-line">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            V-Vet is in its pre-pilot stage
          </p>
        </div>

        <div className="flex justify-center">
          <div className="rounded-[24px] bg-landing-mint p-6 text-center">
            <div className="rounded-[18px] bg-white p-4">
              <QRCodeSVG
                value={WHATSAPP_LINK}
                size={168}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#112111"
                aria-label="QR code that opens a WhatsApp chat with V-Vet"
                role="img"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-landing-pine">Scan to chat on WhatsApp</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerSection() {
  return (
    <ClosingBand
      title={
        <>
          Help us take <span className="whitespace-nowrap">V-Vet</span>{" "}
          <span className="text-landing-leaf">to more farmers</span>
        </>
      }
      lead="Our first pilot in Zimbabwe is funded and we're getting it ready. If you're an NGO, programme, vet or funder and want to get involved, we'd love to hear from you."
    >
      <a href={PARTNER_MAILTO} className={pillPrimaryOnDark}>
        <Mail size={16} aria-hidden="true" />
        Email {PARTNER_EMAIL}
      </a>
    </ClosingBand>
  );
}

export default function LandingPage() {
  return (
    <PublicPage>
      <Hero />
      <TrustMarquee />
      <ProblemSection />
      <FarmersSection />
      <TriageSection />
      <VetsSection />
      <GroundworkSection />
      <AwardsSection />
      <StartSection />
      <PartnerSection />
    </PublicPage>
  );
}
