import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Shield,
  Activity,
  Users,
  BarChart3,
  Leaf,
  MessageSquare,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import heroImage from "@/assets/landing-hero.jpg";
import whatsappScreenshot from "@/assets/whatsapp-screenshot.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const WHATSAPP_LINK = "https://wa.me/447519132951?text=Hello";

const features = [
  {
    icon: Heart,
    title: "Health Tracking",
    desc: "Log symptoms, vitals, and observations for every animal in your herd.",
  },
  {
    icon: Shield,
    title: "Vaccination Records",
    desc: "Never miss a vaccination, track schedules and get overdue alerts.",
  },
  {
    icon: Activity,
    title: "Treatment History",
    desc: "Complete treatment logs with dosages, outcomes, and vet notes.",
  },
  {
    icon: Users,
    title: "Vet Consultations",
    desc: "Submit cases to verified vets and receive diagnoses remotely.",
  },
  {
    icon: BarChart3,
    title: "Herd Analytics",
    desc: "See your herd health at a glance with real time status summaries.",
  },
  {
    icon: Leaf,
    title: "Farm Management",
    desc: "Manage multiple farms, track livestock counts, and organise records.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="V-Vet logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-foreground tracking-tight">
              V-Vet
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/login")}
              className="rounded-full px-5"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          className="grid md:grid-cols-2 gap-12 md:gap-16 items-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <div className="space-y-8">
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-subtle text-primary text-xs font-medium border border-primary/10">
                <Leaf size={13} />
                Livestock health intelligence
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-foreground"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Your herd,{" "}
              <span className="text-primary italic font-serif">expertly</span>{" "}
              managed.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed"
              style={{ textWrap: "pretty" } as React.CSSProperties}
            >
              V-Vet helps African farmers track, monitor, and protect every
              animal in their herd with health logging, vet consultations, and
              vaccination management.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="rounded-full px-7 gap-2 group"
              >
                Start for free
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="rounded-full px-7"
              >
                Sign in
              </Button>
            </motion.div>
          </div>

          {/* Hero image */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30">
              <img
                src={heroImage}
                alt="Healthy cattle grazing on lush green pasture"
                className="w-full h-[380px] md:h-[460px] object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* WhatsApp Integration Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-24 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-12"
        >
          {/* Section Heading */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <h2
              className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Start Directly on WhatsApp
            </h2>
            <p
              className="text-muted-foreground text-base leading-relaxed"
              style={{ textWrap: "pretty" } as React.CSSProperties}
            >
              WhatsApp is V-Vet’s primary user interface for farmers. To use the web platform, users must first set up their account on WhatsApp.
            </p>
          </motion.div>

          {/* Centered Composition: QR Code + Phone Picture close together */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12 max-w-3xl mx-auto"
          >
            {/* Left Side: QR Code, Action Button, Pre Pilot Notice */}
            <div className="space-y-5 flex flex-col items-center text-center shrink-0">
              {/* QR Code Box */}
              <div className="space-y-2 flex flex-col items-center">
                <div className="p-3.5 rounded-2xl border border-border/80 bg-background shadow-sm inline-block">
                  <QRCodeSVG
                    value={WHATSAPP_LINK}
                    size={145}
                    level="H"
                    bgColor="transparent"
                    fgColor="currentColor"
                    className="text-foreground"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  Scan to chat on WhatsApp
                </span>
              </div>

              {/* WhatsApp Link Button matching Get Started button style */}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-all shadow-sm group"
              >
                <span>Chat on WhatsApp</span>
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>

              {/* Pre Pilot Stage Notice */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs border border-amber-500/20 font-medium">
                <Smartphone size={14} className="text-amber-500" />
                <span>V-Vet is currently in pre pilot stage</span>
              </div>
            </div>

            {/* Right Side: Clean Smartphone Mockup */}
            <div className="flex justify-center shrink-0">
              <div className="relative max-w-[260px] w-full">
                <div className="relative rounded-[2.4rem] bg-zinc-950 p-3 ring-1 ring-zinc-800 shadow-xl shadow-black/30">
                  {/* Camera Speaker Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-3.5 bg-zinc-900 rounded-full z-20 flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-950" />
                    <div className="w-8 h-1 bg-zinc-800 rounded-full" />
                  </div>

                  {/* Screen Content */}
                  <div className="relative rounded-[1.9rem] overflow-hidden bg-black aspect-[9/18] border border-zinc-800">
                    <img
                      src={whatsappScreenshot}
                      alt="V-Vet WhatsApp chat demonstration"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-24 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-14"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg mx-auto space-y-3"
          >
            <h2
              className="text-2xl md:text-3xl font-bold text-foreground"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Complete Farm & Herd Intelligence
            </h2>
            <p
              className="text-muted-foreground"
              style={{ textWrap: "pretty" } as React.CSSProperties}
            >
              From daily health checks to emergency vet consultations, all in
              one place.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                transition={{
                  duration: 0.6,
                  delay: i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-card rounded-xl border border-border p-6 space-y-3 hover:shadow-md hover:shadow-black/5 transition-shadow duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="bg-primary rounded-2xl p-10 md:p-16 text-center space-y-6"
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-primary-foreground"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Start protecting your herd today
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-primary-foreground/80 max-w-md mx-auto"
          >
            Join farmers across Africa using V-Vet to keep their livestock
            healthy and productive.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="rounded-full px-8 bg-white text-primary hover:bg-white/90 gap-2 group"
            >
              Get started free
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2026 V-Vet. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="V-Vet logo"
              className="w-6 h-6 rounded object-cover"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}


