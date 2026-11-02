import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ApplicationForm from "@/components/landing/ApplicationForm";
import { getRole } from "@/data/careers";
import heroImage from "@/assets/help-farmer-phone.webp";
import { PageHero, PublicPage } from "@/components/landing/Site";

export default function CareerApply() {
  const { roleId } = useParams();
  const role = getRole(roleId);

  if (!role) return <Navigate to="/careers" replace />;

  return (
    <PublicPage>
      <PageHero
        title={
          <>
            Apply for <span className="text-landing-leaf">{role.title}</span>
          </>
        }
        lead="It takes about ten minutes. Straight after you apply, we'll email you a short coding task."
        image={heroImage}
        imagePosition="50% 25%"
      />

      <section className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <Link
            to={`/careers/${role.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-landing-pine hover:text-landing-forest"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the role
          </Link>
          <div className="mt-6 rounded-[28px] bg-landing-paper p-6 sm:p-10 md:p-14">
            <ApplicationForm roleId={role.id} />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
