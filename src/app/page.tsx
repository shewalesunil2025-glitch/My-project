import { founder, siteConfig } from "@/config/site";
import { DemoProvider } from "@/components/cta/DemoProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { ProblemSection } from "@/components/scroll/ProblemSection";
import { SystemFlow } from "@/components/automation/SystemFlow";
import { Solutions } from "@/components/solutions/Solutions";
import { OneSystem } from "@/components/automation/OneSystem";
import { Industries } from "@/components/industries/Industries";
import { Demos } from "@/components/demos/Demos";
import { Process } from "@/components/process/Process";
import { Philosophy } from "@/components/cta/Philosophy";
import { FinalCta } from "@/components/cta/FinalCta";
import { Founder } from "@/components/about/Founder";
import { Faq } from "@/components/about/Faq";
import { Footer } from "@/components/footer/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteConfig.name,
  url: siteConfig.url,
  email: siteConfig.email,
  founder: { "@type": "Person", name: founder.name, jobTitle: founder.role },
  description: siteConfig.description,
  serviceType: [
    "AI-powered websites",
    "AI WhatsApp automation",
    "AI voice receptionist",
    "AI chatbots",
    "Booking automation",
    "Review automation",
    "Business workflow automation",
  ],
};

export default function HomePage() {
  return (
    <DemoProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main id="main">
        <Hero />
        <ProblemSection />
        <SystemFlow />
        <Solutions />
        <OneSystem />
        <Industries />
        <Demos />
        <Process />
        <Philosophy />
        <Founder />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </DemoProvider>
  );
}
