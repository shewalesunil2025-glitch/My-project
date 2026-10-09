import type { Metadata } from "next";
import { Contact, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal, operatorLine } from "@/content/legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${legal.brand}: email, phone and WhatsApp.`,
  alternates: { canonical: "/contact" },
};

const sections: LegalSection[] = [
  {
    id: "reach",
    title: "Reach us",
    body: (
      <>
        <Contact />
        <p>
          WhatsApp:{" "}
          <a className="link-underline text-fg" href={`https://wa.me/${siteConfig.whatsapp}`} rel="noopener noreferrer" target="_blank">
            message us
          </a>
        </p>
      </>
    ),
  },
  {
    id: "hours",
    title: "Hours",
    body: <p>Monday to Saturday, 10 AM – 7 PM (India time). We reply to emails within 24 hours on working days.</p>,
  },
  {
    id: "business",
    title: "Business details",
    body: <p>{operatorLine} Registered with the Government of India as an MSME (Udyam).</p>,
  },
];

export default function ContactPage() {
  return <LegalPage title="Contact Us" intro={<p>Questions about our services, your account or a payment? We&apos;re happy to help.</p>} sections={sections} />;
}
