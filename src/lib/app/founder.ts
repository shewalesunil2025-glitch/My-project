/** WhatsApp chat link for a client's phone (a bare 10-digit number is taken as Indian). */
export const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0+/, "").replace(/^(\d{10})$/, "91$1")}`;
