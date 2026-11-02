import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import HiringSteps from "@/components/landing/HiringSteps";
import { getRole } from "@/data/careers";
import heroImage from "@/assets/help-farmer-phone.webp";
import {
  Accent,
  CheckList,
  PageHero,
  PublicPage,
  balance,
  pillPrimary,
  pillPrimaryOnDark,
  sectionHeading,
} from "@/components/landing/Site";

const subHeading = "font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink";

const APPLY_WITH = [
  "Your CV",
  "Links to your projects, GitHub or portfolio",
  "A short answer: tell us about something you built on top of an LLM. What went wrong, and how did you fix it?",
  "Your LinkedIn profile, if you have one (optional)",
];

export default function CareerRole() {
  const { roleId } = useParams();
  const role = getRole(roleId);

  if (!role) return <Navigate to="/careers" replace />;
  const applyPath = `/careers/${role.id}/apply`;

  return (
    <PublicPage>
      <PageHero title={role.title} lead={role.summary} image={heroImage} imagePosition="50% 25%">
        <Link to={applyPath} className={pillPrimaryOnDark}>
          Apply now
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </PageHero>

      <section className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <Link to="/careers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-landing-pine hover:text-landing-forest">
            <ArrowLeft size={15} aria-hidden="true" />
            All roles
          </Link>

          <ul className="mt-6 flex flex-wrap gap-2">
            {role.terms.map((term) => (
              <li key={term} className="rounded-full bg-landing-mint px-3.5 py-1.5 text-sm font-medium text-landing-pine">
                {term}
              </li>
            ))}
          </ul>

          <div className="mt-12 space-y-14">
            <div>
              <h2 className={subHeading}>About the role</h2>
              {role.about.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-[17px] leading-relaxed text-landing-muted">
                  {paragraph}
                </p>
              ))}
            </div>

            <div>
              <h2 className={subHeading}>What you'll do</h2>
              <div className="mt-5">
                <CheckList items={role.youWill} />
              </div>
            </div>

            <div>
              <h2 className={subHeading}>Who we're looking for</h2>
              <div className="mt-5">
                <CheckList items={role.lookingFor} />
              </div>
              <div className="mt-6 rounded-[24px] bg-landing-sand p-6">
                <h3 className="font-display text-xl font-semibold text-landing-ink">Nice to have</h3>
                <ul className="mt-2 space-y-2 text-[15px] leading-relaxed text-landing-ink">
                  {role.strongPlus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h2 className={subHeading}>How you work</h2>
              <div className="mt-5">
                <CheckList items={role.howYouWork} />
              </div>
            </div>

            <div>
              <h2 className={subHeading}>What we use</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {role.stack.map((tool) => (
                  <li key={tool} className="rounded-full bg-landing-paper px-3.5 py-1.5 text-sm font-medium text-landing-ink">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className={subHeading}>What to apply with</h2>
              <div className="mt-5">
                <CheckList items={APPLY_WITH} />
              </div>
              <Link to={applyPath} className={`${pillPrimary} mt-8`}>
                Apply for this role
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 md:pb-32">
        <div className="mx-auto max-w-[1100px]">
          <h2 className={sectionHeading} style={balance}>
            How we <Accent>hire</Accent>
          </h2>
          <div className="mt-12">
            <HiringSteps applyTo={applyPath} />
          </div>
        </div>
      </section>

    </PublicPage>
  );
}
