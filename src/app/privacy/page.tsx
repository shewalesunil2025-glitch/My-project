import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal, operatorLine } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${legal.brand} collects, uses and protects your data and your customers' data.`,
  alternates: { canonical: "/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>{operatorLine}</p>
        <p>
          {legal.brand} builds websites and runs AI automations for businesses: WhatsApp replies, voice calls, email, social media, lead follow-up,
          customer support and Google reviews. In this policy, &quot;we&quot; means {legal.brand}; &quot;you&quot; means a business that uses our
          website, app or services; and &quot;your customers&quot; means the people who contact your business through a channel we automate.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong>Account details:</strong> your name, email, mobile number, country and password. If you sign in with Google, we receive your name,
          email address and profile picture from Google. We never see your Google password.
        </p>
        <p>
          <strong>Business details you give us:</strong> business name, category, address, hours, services, prices, FAQs, tone and the other answers
          you give while setting up a service.
        </p>
        <p>
          <strong>Connected accounts:</strong> when you connect WhatsApp, Instagram, Facebook, YouTube, Google Business Profile or email, we receive
          the access needed to run that service (for example, permission to read and reply to messages). You choose what to connect and can
          disconnect at any time.
        </p>
        <p>
          <strong>Your customers&apos; messages:</strong> to run an automation we process the messages, names and phone numbers of people who contact
          your business on a connected channel, and the replies we send.
        </p>
        <p>
          <strong>Payments:</strong> payments are handled by our payment provider. We receive the payment status, amount and a reference, never your
          full card or bank details.
        </p>
        <p>
          <strong>Usage and device data:</strong> basic technical data such as browser type, pages visited and error logs, used to keep the app
          working and secure.
        </p>
        <p>
          <strong>Enquiries:</strong> what you send us through the demo form, the IBAX chat, email or WhatsApp.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To create your account, set up and run the services you buy, and show you their results in the app.</li>
        <li>To write and send automated replies on your behalf, using the business details you gave us.</li>
        <li>To alert you when a customer needs a person, and to keep a record of conversations and leads for you.</li>
        <li>To take payments, send receipts and manage your subscription.</li>
        <li>To answer your questions and provide support.</li>
        <li>To keep the service secure, prevent abuse and fix problems.</li>
        <li>To meet legal obligations.</li>
      </ul>
    ),
  },
  {
    id: "ai",
    title: "AI processing",
    body: (
      <>
        <p>
          Replies and drafts are written by AI models from providers such as Google (Gemini) and Anthropic (Claude). We send them only what is
          needed to write a reply: your business details and the customer&apos;s message and recent conversation. We do not use your data or your
          customers&apos; data to train our own models, and we use AI providers under terms that do not allow them to train on it.
        </p>
        <p>
          AI can make mistakes. You can review and change your business details at any time. The assistant hands over to you when it cannot
          answer or when a customer asks for a person.
        </p>
      </>
    ),
  },
  {
    id: "google",
    title: "Google user data",
    body: (
      <>
        <p>
          {legal.brand}&apos;s use and transfer of information received from Google APIs adheres to the{" "}
          <a className="link-underline text-fg" href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>
          We use Google data (such as Google sign-in, Google Business Profile reviews, YouTube or Gmail, when you connect them) only to provide the
          feature you turned on. We do not sell it, use it for advertising, or let people read it, except with your permission, for security, or to
          comply with the law.
        </p>
      </>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <p>We do not sell personal data. We share it only with the services we use to run {legal.brand}, and only what each one needs:</p>
        <ul>
          <li>Hosting and database: Vercel and Supabase.</li>
          <li>Automation: n8n.</li>
          <li>AI models: Google (Gemini) and Anthropic (Claude).</li>
          <li>Messaging and platforms you connect: Meta (WhatsApp, Instagram, Facebook), Google, YouTube and email providers.</li>
          <li>Payments: our payment provider (for example, Razorpay).</li>
        </ul>
        <p>
          We may also share data if the law requires it, to protect our rights or users&apos; safety, or with a buyer if the business is
          transferred. Some of these providers store data outside India. They protect it under their own security and privacy commitments.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account and business details: while your account is open.</li>
        <li>Conversations, leads and activity: while your service is active, then up to 90 days so you can export them.</li>
        <li>Payment records: as long as tax and accounting law requires.</li>
        <li>When you delete your account, we delete your data within 30 days, except what we must keep by law.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023 and other laws that apply to you, you can ask to see, correct, update or
          delete your personal data, withdraw consent, and name someone to act for you. Many of these you can do yourself in the app, under
          Settings: Business settings, Security, and Privacy &amp; data (Export my data, Delete account). For anything else, contact us. We reply within 30 days.
        </p>
        <p>
          <strong>Your customers&apos; data:</strong> for messages your customers send you, you decide why and how they are used and we process them
          for you. If one of your customers asks us about their data, we will pass the request to you.
        </p>
      </>
    ),
  },
  {
    id: "data-deletion",
    title: "Deleting your data",
    body: (
      <>
        <p>You can delete your account and its data at any time:</p>
        <ul>
          <li>
            In the app: <strong>Settings → Privacy &amp; data → Delete account</strong>. This removes your account, business details, connected accounts and
            conversation history.
          </li>
          <li>
            Or email{" "}
            <a className="link-underline text-fg" href={`mailto:${legal.email}?subject=Delete%20my%20data`}>
              {legal.email}
            </a>{" "}
            with the subject &quot;Delete my data&quot; from the email address on your account. If you used Facebook, Instagram or WhatsApp with us,
            include the name or number of that account.
          </li>
        </ul>
        <p>We confirm by email and complete the deletion within 30 days. Disconnecting an account in the app stops our access to it straight away.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Data is encrypted in transit (HTTPS). Access is limited by account: each business can see only its own workspace. Secret keys stay on our
        servers. No system is perfectly secure. If a breach affects your data, we will tell you and the authorities as the law requires.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>{legal.brand} is for businesses and is not meant for anyone under 18. We do not knowingly collect children&apos;s data.</p>,
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        We use your browser&apos;s storage to keep you signed in and to remember your settings. We do not use advertising cookies or sell
        tracking data.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy. The date at the top shows the latest version. If a change is important, we will tell you in the app or by email
        before it applies.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievance officer",
    body: (
      <>
        <p>For privacy questions, requests or complaints, contact our grievance officer:</p>
        <Contact />
        <p>
          See also our{" "}
          <Link href="/terms" className="link-underline text-fg">
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what data {legal.brand} collects when you use our website, app and automation services, why we collect it, who we
          share it with and the choices you have.
        </p>
      }
      sections={sections}
    />
  );
}
