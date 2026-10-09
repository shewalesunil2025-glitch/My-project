import type { Metadata } from "next";
import { Contact, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal } from "@/content/legal";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: `How and when ${legal.brand} delivers its online services.`,
  alternates: { canonical: "/shipping-policy" },
};

const sections: LegalSection[] = [
  {
    id: "digital",
    title: "Digital services only",
    body: (
      <p>
        {legal.brand} sells online services: websites and AI automations. Nothing is shipped by post or courier, and there are no shipping
        charges.
      </p>
    ),
  },
  {
    id: "when",
    title: "When you get the service",
    body: (
      <ul>
        <li>Your account and the app are available as soon as you sign up.</li>
        <li>
          Automation services start once payment is confirmed and you have connected the accounts the service needs. Most are set up within 1–3
          working days.
        </li>
        <li>Website builds are delivered within the time agreed for your project, usually 7–14 working days after we receive your content.</li>
        <li>We confirm each step by email or in the app, and you can follow progress in the app.</li>
      </ul>
    ),
  },
  {
    id: "delays",
    title: "Delays",
    body: (
      <p>
        If a delay is caused by us, we tell you the new date. If a service cannot be delivered, you can cancel and get a refund under our{" "}
        <a href="/refund-policy" className="link-underline text-fg">
          Cancellation &amp; Refund Policy
        </a>
        .
      </p>
    ),
  },
  { id: "contact", title: "Contact", body: <Contact /> },
];

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      intro={<p>This page explains how {legal.brand} delivers the services you buy.</p>}
      sections={sections}
    />
  );
}
