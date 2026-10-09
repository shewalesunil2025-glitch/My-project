import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal } from "@/content/legal";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: `How cancellations and refunds work for ${legal.brand} subscriptions and website builds.`,
  alternates: { canonical: "/refund-policy" },
};

const sections: LegalSection[] = [
  {
    id: "cancel",
    title: "Cancelling a subscription",
    body: (
      <ul>
        <li>You can cancel any monthly or annual plan at any time, in the app (Billing) or by emailing or messaging us.</li>
        <li>The service stays active until the end of the period you have paid for. You are not charged again after cancelling.</li>
        <li>There is no cancellation fee.</li>
      </ul>
    ),
  },
  {
    id: "subscriptions",
    title: "Refunds on subscriptions",
    body: (
      <ul>
        <li>A payment for a period that has already started is not refunded.</li>
        <li>
          If a service could not be delivered because of a fault on our side, we refund the unused part of that period, or the full payment if the
          service never started.
        </li>
        <li>If you were charged twice or charged by mistake, we refund the extra payment in full.</li>
      </ul>
    ),
  },
  {
    id: "websites",
    title: "Refunds on website builds",
    body: (
      <ul>
        <li>Full refund if you cancel before we start the design.</li>
        <li>After the design has started, the work already done is charged and the rest is refunded.</li>
        <li>No refund after the website has been delivered and approved by you.</li>
      </ul>
    ),
  },
  {
    id: "how",
    title: "How to ask for a refund",
    body: (
      <p>
        Email{" "}
        <a className="link-underline text-fg" href={`mailto:${legal.email}?subject=Refund%20request`}>
          {legal.email}
        </a>{" "}
        or WhatsApp {legal.phoneDisplay} with your account email, the payment date and the reason. We reply within 2 working days.
      </p>
    ),
  },
  {
    id: "timeline",
    title: "When the money comes back",
    body: <p>Approved refunds are sent to the original payment method within 7–10 working days. Your bank may take a few more days to show it.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <Contact />
        <p>
          These rules are also part of our{" "}
          <Link href="/terms" className="link-underline text-fg">
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      intro={<p>This page explains how to cancel a {legal.brand} service and when you can get your money back.</p>}
      sections={sections}
    />
  );
}
