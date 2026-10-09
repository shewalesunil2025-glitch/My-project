import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal, operatorLine } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${legal.brand}'s website, app and automation services.`,
  alternates: { canonical: "/terms" },
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    body: (
      <>
        <p>{operatorLine}</p>
        <p>
          These terms apply when you use the {legal.brand} website, the {legal.brand} app or any service you buy from us. By creating an account,
          paying for a service or using the app, you agree to them. If you use {legal.brand} for a business, you confirm you can accept these terms
          for that business.
        </p>
      </>
    ),
  },
  {
    id: "services",
    title: "Our services",
    body: (
      <>
        <p>
          {legal.brand} provides websites and AI automation services, such as WhatsApp automation, an AI voice assistant, email automation, Google
          review management, lead follow-up, customer support, social media automation and digital marketing. Each service page in the app shows
          what is included and its price.
        </p>
        <p>
          Some services are marked <strong>Coming soon</strong>. They cannot be bought yet. Joining the waitlist is free and does not commit you to
          anything.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>You must be at least 18 and give accurate details.</li>
        <li>Keep your password safe. You are responsible for what happens in your account.</li>
        <li>Tell us straight away if you think someone else has used it.</li>
      </ul>
    ),
  },
  {
    id: "payments",
    title: "Prices, payments and renewals",
    body: (
      <ul>
        <li>Prices are shown in the app before you pay. Taxes are added where the law requires.</li>
        <li>
          Monthly and annual plans renew automatically at the end of each period until you cancel. One-time services (such as a website build) are
          charged once.
        </li>
        <li>Payments are processed by our payment provider. If a payment fails, the service may pause until it is paid.</li>
        <li>We may change prices for future periods. We will tell you at least 15 days before a change applies to you.</li>
      </ul>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation and refunds",
    body: (
      <ul>
        <li>
          You can cancel a subscription any time in the app (Billing) or by contacting us. It stays active until the end of the period you paid for,
          and you are not charged again.
        </li>
        <li>
          Subscription payments are not refunded for a period that has started, unless the service could not be delivered because of a fault on our
          side. Then we refund the unused part.
        </li>
        <li>
          Website builds: full refund if you cancel before we start the design. After we start, the work already done is charged and the rest is
          refunded.
        </li>
        <li>Approved refunds go back to the original payment method within 7–10 working days.</li>
      </ul>
    ),
  },
  {
    id: "your-content",
    title: "Your content and connected accounts",
    body: (
      <>
        <p>
          You own your business details, content and customer conversations. You give us permission to use them only to provide the services you
          turned on, as described in our{" "}
          <Link href="/privacy" className="link-underline text-fg">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          When you connect WhatsApp, Instagram, Facebook, YouTube, Google or email, you also have to follow that platform&apos;s own rules. A
          platform can limit or close an account for its own reasons. We are not responsible for a platform&apos;s decisions, outages or rule
          changes, but we will help you where we can.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You must not use {legal.brand} to:</p>
        <ul>
          <li>send spam, bulk promotional messages or messages to people who have not agreed to hear from you;</li>
          <li>post fake reviews, or offer rewards for reviews in a way the platform forbids;</li>
          <li>mislead people, impersonate anyone, or break consumer, privacy or advertising law;</li>
          <li>share illegal, hateful, adult or harmful content;</li>
          <li>attack, overload or try to get around the security of the service.</li>
        </ul>
        <p>If you do, we may pause or close the service without a refund.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI-generated replies",
    body: (
      <p>
        Our automations use AI to write replies and drafts from the business details you give us. AI can be wrong, so keep your details (prices,
        hours, FAQs) up to date and check important replies. The assistant is set up to hand over to you instead of guessing, but you remain
        responsible for what your business tells its customers.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep {legal.brand} running at all times, but there may be interruptions for maintenance or because of providers we rely on. We may
        improve or change features. If a change removes something important from a service you pay for, we will tell you, and you can cancel.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          The services are provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect losses, such as lost profits, lost
          business, or losses caused by third-party platforms.
        </p>
        <p>
          Our total liability for any claim is limited to the amount you paid us for the affected service in the 3 months before the claim. Nothing
          in these terms limits liability that cannot be limited by law.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Ending the agreement",
    body: (
      <p>
        You can stop using {legal.brand} and delete your account at any time. We may suspend or close an account that breaks these terms or does not
        pay, after telling you where possible. When an account is closed, your data is handled as described in our Privacy Policy.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of {legal.country}. Please contact us first so we can try to solve any problem. If we cannot, the
        courts in {legal.city}, {legal.state} have jurisdiction.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <Contact />,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={<p>Please read these terms before using {legal.brand}. They explain what we provide, what we expect from you, and how payments, cancellations and refunds work.</p>}
      sections={sections}
    />
  );
}
