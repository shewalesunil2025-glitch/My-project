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
        <li>Everything is self-service and available straight away. Your account and the app work as soon as you sign up.</li>
        <li>
          <strong>Automations:</strong> you switch them on yourself by chatting with IBAX, the assistant in the app. As soon as payment is
          confirmed and you have given the details and connected the accounts the service needs (for example, your WhatsApp number), the
          automation starts.
        </li>
        <li>
          <strong>Websites:</strong> you build your website yourself in the app from our templates. It is ready as soon as you publish it.
        </li>
        <li>The app shows the status of every service, and confirms each step.</li>
      </ul>
    ),
  },
  {
    id: "delays",
    title: "Help and delays",
    body: (
      <p>
        If you get stuck, ask IBAX in the app at any time, or contact us. If a service cannot start because of a problem on our side, we
        tell you and fix it. If it still cannot be delivered, you can cancel and get a refund under our{" "}
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
