const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatINR(amount: number): string {
  return inr.format(amount);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Hides the middle of a service number: "IC-78231K" -> "IC-7•••1K" */
export function maskServiceId(id: string): string {
  if (id.length <= 5) return id;
  return id.slice(0, 4) + '•'.repeat(Math.max(3, id.length - 6)) + id.slice(-2);
}

export function maskMobile(m: string): string {
  return m.length === 10 ? `${m.slice(0, 2)}••••••${m.slice(-2)}` : m;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
