import { founder, siteConfig } from "@/config/site";
import { DemoProvider } from "@/components/cta/DemoProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { ConnectSection } from "@/components/scroll/ConnectSection";
import { Solutions } from "@/components/solutions/Solutions";
import { OneSystem } from "@/components/automation/OneSystem";
import { Industries } from "@/components/industries/Industries";
import { FinalCta } from "@/components/cta/FinalCta";
import { Founder } from "@/components/about/Founder";
import { Faq } from "@/components/about/Faq";
import { Footer } from "@/components/footer/Footer";
import { Shambhu } from "@/components/shambhu/Shambhu";
import { AutomationStore } from "@/components/shambhu/AutomationStore";
import { DigitalMarketing } from "@/components/marketing/DigitalMarketing";
import { ShambhuAgent } from "@/components/shambhu/ShambhuAgent";
import { ScrollPanel } from "@/components/effects/ScrollPanel";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteConfig.name,
  url: siteConfig.url,
  email: siteConfig.email,
  telephone: siteConfig.phone,
  founder: { "@type": "Person", name: founder.name, jobTitle: founder.role },
  description: siteConfig.description,
  serviceType: [
    "Websites",
    "AI voice assistant",
    "WhatsApp automation",
    "Customer support automation",
    "Lead follow-up",
    "Instagram, Facebook and YouTube automation",
    "Email automation",
    "Google review management",
    "Digital marketing",
  ],
};

export default function HomePage() {
  return (
    <DemoProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main id="main">
        <Hero />
        <ConnectSection />
        <Solutions />
        <ScrollPanel>
          <AutomationStore />
        </ScrollPanel>
        <ScrollPanel>
          <DigitalMarketing />
        </ScrollPanel>
        <ScrollPanel>
          <OneSystem />
        </ScrollPanel>
        <ScrollPanel>
          <Shambhu />
        </ScrollPanel>
        <ScrollPanel variant="paper">
          <Industries />
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
      <ShambhuAgent />
    </DemoProvider>
  );
}
