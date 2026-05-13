import { HeroBrutal } from "./HeroBrutal";
import { StatsRibbon } from "./StatsRibbon";
import { ManifestoSection } from "./ManifestoSection";
import { FeaturedProjects } from "./FeaturedProjects";
import { ServicesGridHome } from "./ServicesGridHome";
import { ProcessTimeline } from "./ProcessTimeline";
import { TechMarquee } from "./TechMarquee";
import { AudienceSection } from "./AudienceSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { CtaFinalSection } from "./CtaFinalSection";

export function HomePage() {
  return (
    <>
      <HeroBrutal />
      <StatsRibbon />
      <ManifestoSection />
      <FeaturedProjects />
      <ServicesGridHome />
      <ProcessTimeline />
      <TechMarquee />
      <AudienceSection />
      <TestimonialsSection />
      <CtaFinalSection />
    </>
  );
}
