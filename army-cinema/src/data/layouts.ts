import type { LayoutKey, RankCategory } from '@/types';

export type SeatType = 'family' | 'single' | null;
export type BlockReason = 'reserved' | 'media' | null;

export interface SeatDef {
  id: string; // e.g. "ORS-A12"
  row: string;
  number: number;
  category: RankCategory;
  type: SeatType;
  blocked: BlockReason;
}

export type RowItem = { kind: 'seat'; seat: SeatDef } | { kind: 'aisle'; key: string };

export interface CategoryLayout {
  key: RankCategory;
  name: string;
  full: string;
  note: string;
  rows: { label: string; items: RowItem[] }[];
  total: number;
  bookable: number;
  types: Exclude<SeatType, null>[];
}

export interface SeatLayout {
  key: LayoutKey;
  name: string;
  categories: CategoryLayout[];
  vipSofas: number;
  capacity: number;
}

interface RowSpec {
  row: string;
  from: number;
  to: number;
}
interface SectionSpec {
  type: SeatType;
  rows: RowSpec[];
}
interface CategorySpec {
  key: RankCategory;
  name: string;
  full: string;
  note: string;
  rowOrder: string[];
  sections: SectionSpec[];
  /** Split rows with no type change into two halves at this seat number */
  centreAisleAfter?: number;
  blocked?: (row: string, n: number) => BlockReason;
}

export const CATEGORY_META: Record<RankCategory, { name: string; full: string; short: string }> = {
  OFFRS: { name: 'OFFRs', full: 'Officers', short: 'Officers' },
  JCOS: { name: 'JCOs', full: 'Junior Commissioned Officers', short: 'JCOs' },
  ORS: { name: 'ORs', full: 'Other Ranks', short: 'Other Ranks' },
};

export const MAX_SEATS_PER_BOOKING = 4;

function buildCategory(spec: CategorySpec): CategoryLayout {
  const rowMap = new Map<string, SeatDef[]>();
  const types = new Set<Exclude<SeatType, null>>();
  for (const sec of spec.sections) {
    if (sec.type) types.add(sec.type);
    for (const r of sec.rows) {
      const list = rowMap.get(r.row) ?? [];
      for (let n = r.from; n <= r.to; n++) {
        list.push({
          id: `${spec.key}-${r.row}${n}`,
          row: r.row,
          number: n,
          category: spec.key,
          type: sec.type,
          blocked: spec.blocked?.(r.row, n) ?? null,
        });
      }
      rowMap.set(r.row, list);
    }
  }
  let total = 0;
  let bookable = 0;
  const rows = spec.rowOrder
    .filter((l) => rowMap.has(l))
    .map((label) => {
      // Seat 1 sits on the right, as on the auditorium's physical chart.
      const seats = rowMap.get(label)!.slice().sort((a, b) => b.number - a.number);
      const items: RowItem[] = [];
      seats.forEach((seat, i) => {
        const prev = seats[i - 1];
        const typeChange = prev && prev.type !== seat.type;
        const centre = prev && spec.centreAisleAfter && prev.number > spec.centreAisleAfter && seat.number <= spec.centreAisleAfter;
        if (typeChange || centre) items.push({ kind: 'aisle', key: `${label}-a${i}` });
        items.push({ kind: 'seat', seat });
        total++;
        if (!seat.blocked) bookable++;
      });
      return { label, items };
    });
  return { key: spec.key, name: spec.name, full: spec.full, note: spec.note, rows, total, bookable, types: [...types] };
}

/* ------------------------------------------------------------------------ */
/* Kerketta Auditorium — reproduced from the reference booking site's chart  */
/* ------------------------------------------------------------------------ */

const ORS_MAX: Record<string, number> = { A: 31, B: 31, C: 31, D: 32, E: 32, F: 33, G: 33, H: 35, I: 36, J: 36, K: 36 };
const ORS_ROWS = Object.keys(ORS_MAX);
const RESERVED_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MEDIA_SEATS: Record<string, number[]> = { C: [15, 16, 17, 18, 19], D: [15, 16, 17, 18, 19] };

const kerkettaBlocked = (row: string, n: number): BlockReason => {
  if (MEDIA_SEATS[row]?.includes(n)) return 'media';
  if (RESERVED_ROWS.includes(row)) {
    const mx = ORS_MAX[row];
    if (n === 1 || n === 2 || n === mx || n === mx - 1) return 'reserved';
  }
  return null;
};

const KERKETTA: CategorySpec[] = [
  {
    key: 'OFFRS',
    ...CATEGORY_META.OFFRS,
    note: 'Rows L–N',
    rowOrder: ['L', 'M', 'N'],
    sections: [
      {
        type: null,
        rows: [
          { row: 'L', from: 6, to: 24 },
          { row: 'M', from: 6, to: 24 },
          { row: 'N', from: 6, to: 25 },
        ],
      },
    ],
  },
  {
    key: 'JCOS',
    ...CATEGORY_META.JCOS,
    note: 'Family & single members',
    rowOrder: ['L', 'M', 'N', 'O', 'P', 'Q', 'R'],
    sections: [
      {
        type: 'family',
        rows: [
          { row: 'L', from: 1, to: 5 },
          { row: 'M', from: 1, to: 5 },
          { row: 'N', from: 1, to: 5 },
          { row: 'O', from: 1, to: 5 },
          { row: 'P', from: 1, to: 13 },
          { row: 'Q', from: 1, to: 13 },
          { row: 'R', from: 1, to: 12 },
        ],
      },
      {
        type: 'single',
        rows: [
          { row: 'L', from: 6, to: 10 },
          { row: 'M', from: 25, to: 29 },
          { row: 'N', from: 25, to: 29 },
          { row: 'O', from: 26, to: 30 },
          { row: 'P', from: 14, to: 26 },
          { row: 'Q', from: 14, to: 26 },
          { row: 'R', from: 13, to: 24 },
        ],
      },
    ],
  },
  {
    key: 'ORS',
    ...CATEGORY_META.ORS,
    note: 'Single (seats 1–10) & family (seats 11+)',
    rowOrder: ORS_ROWS,
    sections: [
      { type: 'single', rows: ORS_ROWS.map((r) => ({ row: r, from: 1, to: 10 })) },
      { type: 'family', rows: ORS_ROWS.map((r) => ({ row: r, from: 11, to: ORS_MAX[r] })) },
    ],
    blocked: kerkettaBlocked,
  },
];

/* Smaller demo halls */

function uniform(key: RankCategory, rows: string[], seats: number, note: string, familySplit?: number): CategorySpec {
  const sections: SectionSpec[] = familySplit
    ? [
        { type: 'single', rows: rows.map((r) => ({ row: r, from: 1, to: familySplit })) },
        { type: 'family', rows: rows.map((r) => ({ row: r, from: familySplit + 1, to: seats })) },
      ]
    : [{ type: null, rows: rows.map((r) => ({ row: r, from: 1, to: seats })) }];
  return {
    key,
    ...CATEGORY_META[key],
    note,
    rowOrder: rows,
    sections,
    centreAisleAfter: familySplit ? undefined : Math.floor(seats / 2),
  };
}

const COMPACT: CategorySpec[] = [
  uniform('OFFRS', ['J', 'K'], 16, 'Rows J–K'),
  uniform('JCOS', ['F', 'G', 'H'], 18, 'Family & single members', 8),
  uniform('ORS', ['A', 'B', 'C', 'D', 'E'], 20, 'Single (1–10) & family (11+)', 10),
];

const STANDARD: CategorySpec[] = [
  uniform('OFFRS', ['L', 'M', 'N'], 20, 'Rows L–N'),
  uniform('JCOS', ['H', 'I', 'J', 'K'], 22, 'Family & single members', 10),
  uniform('ORS', ['A', 'B', 'C', 'D', 'E', 'F', 'G'], 24, 'Single (1–10) & family (11+)', 10),
];

function build(key: LayoutKey, name: string, specs: CategorySpec[], vipSofas: number): SeatLayout {
  const categories = specs.map(buildCategory);
  return { key, name, categories, vipSofas, capacity: categories.reduce((s, c) => s + c.total, 0) };
}

export const LAYOUTS: Record<LayoutKey, SeatLayout> = {
  kerketta: build('kerketta', 'Kerketta Auditorium (540 seats)', KERKETTA, 11),
  compact: build('compact', 'Compact hall', COMPACT, 0),
  standard: build('standard', 'Standard hall', STANDARD, 6),
};

// Fill in capacities in the names of the generated halls
LAYOUTS.compact.name = `Compact hall (${LAYOUTS.compact.capacity} seats)`;
LAYOUTS.standard.name = `Standard hall (${LAYOUTS.standard.capacity} seats)`;

export function getLayout(key: LayoutKey): SeatLayout {
  return LAYOUTS[key] ?? LAYOUTS.compact;
}

/** Flat index of every seat in a layout, keyed by id. */
const seatIndexCache = new Map<LayoutKey, Map<string, SeatDef>>();
export function seatIndex(key: LayoutKey): Map<string, SeatDef> {
  let idx = seatIndexCache.get(key);
  if (!idx) {
    idx = new Map();
    for (const c of getLayout(key).categories)
      for (const r of c.rows) for (const it of r.items) if (it.kind === 'seat') idx.set(it.seat.id, it.seat);
    seatIndexCache.set(key, idx);
  }
  return idx;
}

export function bookableSeatCount(key: LayoutKey): number {
  return getLayout(key).categories.reduce((s, c) => s + c.bookable, 0);
}

/** "ORS-A12" -> "A12" */
export function seatLabel(id: string): string {
  const i = id.indexOf('-');
  return i >= 0 ? id.slice(i + 1) : id;
}

export function sortSeatIds(ids: string[]): string[] {
  return ids.slice().sort((a, b) => {
    const la = seatLabel(a);
    const lb = seatLabel(b);
    const ra = la.replace(/\d+/g, '');
    const rb = lb.replace(/\d+/g, '');
    return ra === rb ? parseInt(la.slice(ra.length)) - parseInt(lb.slice(rb.length)) : ra.localeCompare(rb);
  });
}
