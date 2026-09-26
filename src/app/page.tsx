import { founder, siteConfig } from "@/config/site";
import { DemoProvider } from "@/components/cta/DemoProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { ConnectSection } from "@/components/scroll/ConnectSection";
import { Solutions } from "@/components/solutions/Solutions";
import { Pillars } from "@/components/solutions/Pillars";
import { OneSystem } from "@/components/automation/OneSystem";
import { Industries } from "@/components/industries/Industries";
import { Demos } from "@/components/demos/Demos";
import { Process } from "@/components/process/Process";
import { Philosophy } from "@/components/cta/Philosophy";
import { FinalCta } from "@/components/cta/FinalCta";
import { Founder } from "@/components/about/Founder";
import { Faq } from "@/components/about/Faq";
import { Footer } from "@/components/footer/Footer";
import { ScrollPanel } from "@/components/effects/ScrollPanel";
import { AiOrb } from "@/components/effects/AiOrb";

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
        <ScrollPanel variant="paper">
          <ConnectSection />
        </ScrollPanel>
        <ScrollPanel>
          <Solutions />
        </ScrollPanel>
        <ScrollPanel>
          <Philosophy />
        </ScrollPanel>
        <ScrollPanel>
          <OneSystem />
        </ScrollPanel>
        <ScrollPanel variant="paper">
          <Demos />
        </ScrollPanel>
        <ScrollPanel variant="paper">
          <Industries />
        </ScrollPanel>
        <ScrollPanel>
          <Pillars />
        </ScrollPanel>
        <ScrollPanel>
          <Process />
        </ScrollPanel>
        <ScrollPanel>
          <Founder />
        </ScrollPanel>
        <ScrollPanel>
          <Faq />
        </ScrollPanel>
        <ScrollPanel>
          <FinalCta />
        </ScrollPanel>
      </main>
      <Footer />
      <AiOrb />
    </DemoProvider>
  );
}
