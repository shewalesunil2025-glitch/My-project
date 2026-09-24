export type Industry = {
  id: string;
  name: string;
  outcome: string;
  flow: string[];
};

export const industries: Industry[] = [
  {
    id: "healthcare",
    name: "Healthcare",
    outcome: "Patients get answers and appointments without waiting on hold.",
    flow: ["Website", "AI Chat", "Voice Receptionist", "Appointment", "Reminder", "Follow-up"],
  },
  {
    id: "dental",
    name: "Dental Clinics",
    outcome: "Fewer no-shows, fuller chairs, more five-star reviews.",
    flow: ["Website", "AI Chat", "WhatsApp", "Appointment", "Reminder", "Review"],
  },
  {
    id: "clinics",
    name: "Hair & Skin Clinics",
    outcome: "Consultations booked while interest is at its peak.",
    flow: ["Instagram", "WhatsApp", "AI Qualification", "Consultation", "Reminder", "Review"],
  },
  {
    id: "beauty",
    name: "Beauty & Salon",
    outcome: "A full calendar that fills itself — and rebooks regulars.",
    flow: ["Website", "AI Chat", "Booking", "WhatsApp Reminder", "Rebooking", "Review"],
  },
  {
    id: "restaurants",
    name: "Restaurants",
    outcome: "Reservations and questions handled while the kitchen is busy.",
    flow: ["Website", "AI Chat", "Reservation", "WhatsApp", "Follow-up", "Review"],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    outcome: "Every inquiry qualified and routed within seconds.",
    flow: ["Listing", "AI Chat", "Lead Qualification", "WhatsApp", "Site Visit", "Follow-up"],
  },
  {
    id: "insurance",
    name: "Insurance",
    outcome: "Quotes, documents and renewals — handled around the clock.",
    flow: ["Website", "AI Chat", "Lead Capture", "Callback", "Renewal Reminder", "Follow-up"],
  },
  {
    id: "local",
    name: "Local Businesses",
    outcome: "Big-company responsiveness without a big-company team.",
    flow: ["Google", "Website", "AI Chat", "WhatsApp", "Booking", "Review"],
  },
  {
    id: "professional",
    name: "Professional Services",
    outcome: "Qualified consultations, prepared before the first call.",
    flow: ["Website", "AI Intake", "Qualification", "Booking", "Reminder", "Follow-up"],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    outcome: "Support, order updates and recovery that never sleeps.",
    flow: ["Store", "AI Support", "Order Update", "WhatsApp", "Cart Recovery", "Review"],
  },
];
