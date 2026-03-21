import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sun,
  Moon,
  ArrowRight,
  Heart,
  Shield,
  Activity,
  Users,
  BarChart3,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/landing-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const features = [
  {
    icon: Heart,
    title: "Health Tracking",
    desc: "Log symptoms, vitals, and observations for every animal in your herd.",
  },
  {
    icon: Shield,
    title: "Vaccination Records",
    desc: "Never miss a vaccination — track schedules and get overdue alerts.",
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
    desc: "See your herd health at a glance with real-time status summaries.",
  },
  {
    icon: Leaf,
    title: "Farm Management",
    desc: "Manage multiple farms, track livestock counts, and organise records.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
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
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-foreground"
            >
              Sign in
            </Button>
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
              animal in their herd — with health logging, vet consultations, and
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
            {/* Floating card */}
            <div className="absolute -bottom-4 left-6 bg-card rounded-xl shadow-lg border border-border px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center">
                <Heart size={16} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  8 animals thriving
                </p>
                <p className="text-xs text-muted-foreground">
                  All herds healthy today
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-24">
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
              Everything your farm needs
            </h2>
            <p
              className="text-muted-foreground"
              style={{ textWrap: "pretty" } as React.CSSProperties}
            >
              From daily health checks to emergency vet consultations — all in
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
