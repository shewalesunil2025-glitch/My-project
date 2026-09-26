import type { CategoryPrices, Movie, Profile, RankCategory, Screen, Theatre, WeeklySchedule } from '@/types';

/**
 * Demo data. The Kerketta Auditorium entries (current movie, screening history,
 * weekly schedule and seat chart) are taken from the reference booking site;
 * everything else is illustrative demo content.
 */

const created = '2026-06-01T09:00:00.000Z';

export const SEED_MOVIES: Movie[] = [
  {
    id: 'mv-mirzapur',
    slug: 'mirzapur',
    title: 'Mirzapur',
    tagline: 'Now showing at Kerketta Auditorium',
    description:
      'Power, loyalty and revenge collide in the heartland as the families of Mirzapur fight for the throne. A gritty Hindi action-thriller with a powerhouse ensemble.',
    genres: ['Action', 'Thriller'],
    language: 'Hindi',
    durationMin: 195,
    certification: 'A',
    score: null,
    releaseDate: '2026-09-25',
    director: 'Priyadarshan',
    cast: ['Pankaj Tripathi', 'Saveta Tripathi', 'Ravi Kishan'],
    posterUrl: null,
    trailerUrl: null,
    status: 'now_showing',
    featured: true,
    palette: ['#5c1320', '#0b1731'],
    createdAt: created,
  },
  {
    id: 'mv-jan-neta',
    slug: 'jan-neta',
    title: 'Jan Neta',
    tagline: 'Two leaders. One reckoning.',
    description:
      "Ideological enemies — one populist, one authoritarian — meet again when a child's fate forces them onto the same side. A political action drama.",
    genres: ['Action', 'Drama', 'Political'],
    language: 'Hindi',
    durationMin: 180,
    certification: 'UA 13+',
    score: null,
    releaseDate: '2026-08-07',
    director: 'H Vinoth',
    cast: ['Thalapathy Vijay', 'Pooja Hegde', 'Bobby Deol', 'Mamitha Baiju'],
    posterUrl: null,
    trailerUrl: null,
    status: 'now_showing',
    featured: false,
    palette: ['#7a3b06', '#101a33'],
    createdAt: created,
  },
  {
    id: 'mv-dulhaniya',
    slug: 'dulhaniya-le-aaeegi',
    title: 'Dulhaniya Le Aaeegi',
    tagline: 'A wedding. Total chaos.',
    description:
      'A madcap family comedy in which one wedding, three schemers and a runaway plan turn a quiet town upside down.',
    genres: ['Comedy', 'Drama'],
    language: 'Hindi',
    durationMin: 140,
    certification: 'U',
    score: null,
    releaseDate: '2026-07-31',
    director: 'Indra Kumar',
    cast: ['Ajay Devgn', 'Riteish Deshmukh', 'Arshad Warsi', 'Esha Gupta', 'Ravi Kishan', 'Jaaved Jaaferi'],
    posterUrl: null,
    trailerUrl: null,
    status: 'now_showing',
    featured: false,
    palette: ['#8a2f6b', '#141b3a'],
    createdAt: created,
  },
  {
    id: 'mv-welcome-jungle',
    slug: 'welcome-to-the-jungle',
    title: 'Welcome to the Jungle',
    tagline: 'The manhunt gets wild.',
    description:
      'A high-stakes manhunt sends two police officers after a feared criminal — but the chase through the jungle turns into a riot of action and comedy.',
    genres: ['Action', 'Comedy', 'Drama'],
    language: 'Hindi',
    durationMin: 170,
    certification: 'UA 7+',
    score: null,
    releaseDate: '2026-06-26',
    director: 'Ahmed Khan',
    cast: ['Akshay Kumar', 'Sunil Shetty', 'Raveena Tandon', 'Disha Patani'],
    posterUrl: null,
    trailerUrl: null,
    status: 'now_showing',
    featured: false,
    palette: ['#14532d', '#0b1731'],
    createdAt: created,
  },
  {
    id: 'mv-northern-ridge',
    slug: 'operation-northern-ridge',
    title: 'Operation Northern Ridge',
    tagline: 'Hold the line. Bring them home.',
    description:
      'Cut off by a winter storm, a small section of soldiers must hold a high-altitude post for seventy-two hours. (Demo title.)',
    genres: ['War', 'Drama'],
    language: 'Hindi',
    durationMin: 152,
    certification: 'UA 13+',
    score: null,
    releaseDate: '2026-10-16',
    director: 'Demo Studio',
    cast: ['Demo Cast'],
    posterUrl: null,
    trailerUrl: null,
    status: 'upcoming',
    featured: true,
    palette: ['#1e3a5f', '#050b18'],
    createdAt: created,
  },
  {
    id: 'mv-siachen-sunrise',
    slug: 'siachen-sunrise',
    title: 'Siachen Sunrise',
    tagline: 'The highest battlefield. The warmest hearts.',
    description:
      'A young medical officer and a veteran havildar build an unlikely bond at the roof of the world. (Demo title.)',
    genres: ['Drama', 'Family'],
    language: 'Hindi',
    durationMin: 138,
    certification: 'U',
    score: null,
    releaseDate: '2026-10-30',
    director: 'Demo Studio',
    cast: ['Demo Cast'],
    posterUrl: null,
    trailerUrl: null,
    status: 'upcoming',
    featured: false,
    palette: ['#0e4c6e', '#0a1226'],
    createdAt: created,
  },
  {
    id: 'mv-wings-ladakh',
    slug: 'wings-over-ladakh',
    title: 'Wings Over Ladakh',
    tagline: 'Every mission. Every life.',
    description:
      'Helicopter pilots race weather and terrain to evacuate a stranded village before nightfall. (Demo title.)',
    genres: ['Action', 'Adventure'],
    language: 'Hindi',
    durationMin: 146,
    certification: 'UA 7+',
    score: null,
    releaseDate: '2026-11-13',
    director: 'Demo Studio',
    cast: ['Demo Cast'],
    posterUrl: null,
    trailerUrl: null,
    status: 'upcoming',
    featured: false,
    palette: ['#7c4a03', '#0b1731'],
    createdAt: created,
  },
];

/** Weekly schedule from the reference: Thursday closed, Sunday two shows. */
export const KERKETTA_SCHEDULE: WeeklySchedule = {
  0: ['14:30', '18:30'],
  1: ['18:30'],
  2: ['18:30'],
  3: ['18:30'],
  4: [],
  5: ['18:30'],
  6: ['18:30'],
};

export const SEED_THEATRES: Theatre[] = [
  {
    id: 'th-kerketta',
    slug: 'kerketta-auditorium',
    name: 'Kerketta Auditorium',
    location: 'Military Station',
    city: 'Cantonment',
    description:
      'The station auditorium with dedicated Officer, JCO and Other Ranks enclosures, family seating and a VIP sofa row. Closed on Thursdays for maintenance.',
    facilities: ['Family enclosure', 'VIP sofa row', 'Digital sound', 'Parking'],
    layoutKey: 'kerketta',
    weeklySchedule: KERKETTA_SCHEDULE,
    active: true,
    createdAt: created,
  },
  {
    id: 'th-sudarshan',
    slug: 'sudarshan-cinema-hall',
    name: 'Sudarshan Cinema Hall',
    location: 'Garrison Road',
    city: 'Demo Cantonment',
    description: 'A compact air-conditioned hall with evening and late shows. (Demo theatre.)',
    facilities: ['Air-conditioned', 'Canteen', 'Wheelchair access'],
    layoutKey: 'compact',
    weeklySchedule: { 0: ['12:30', '18:00', '21:00'], 1: ['18:00'], 2: [], 3: ['18:00'], 4: ['18:00'], 5: ['18:00', '21:00'], 6: ['15:00', '18:00', '21:00'] },
    active: true,
    createdAt: created,
  },
  {
    id: 'th-paramvir',
    slug: 'param-vir-theatre',
    name: 'Param Vir Theatre',
    location: 'Station Complex',
    city: 'Demo Cantonment',
    description: 'A modern hall with recliner-style officer rows and a family enclosure. (Demo theatre.)',
    facilities: ['Dolby audio', 'Family enclosure', 'Canteen', 'Parking'],
    layoutKey: 'standard',
    weeklySchedule: { 0: ['11:00', '15:00', '19:00'], 1: [], 2: ['19:00'], 3: ['19:00'], 4: ['19:00'], 5: ['19:00'], 6: ['15:00', '19:00'] },
    active: true,
    createdAt: created,
  },
];

export const SEED_SCREENS: Screen[] = SEED_THEATRES.map((t) => ({
  id: `sc-${t.id.slice(3)}-1`,
  theatreId: t.id,
  name: 'Main Hall',
  layoutKey: t.layoutKey,
}));

export const DEFAULT_PRICES: CategoryPrices = { OFFRS: 150, JCOS: 100, ORS: 70 };

/** Which movies each theatre rotates through when demo shows are generated. */
export const THEATRE_ROTATION: Record<string, string[]> = {
  'th-kerketta': ['mv-mirzapur'],
  'th-sudarshan': ['mv-welcome-jungle', 'mv-dulhaniya', 'mv-mirzapur'],
  'th-paramvir': ['mv-jan-neta', 'mv-mirzapur', 'mv-dulhaniya'],
};

/**
 * MOCK service-record registry used by the demo verification flow.
 * No real military database is connected.
 */
export interface RegistryEntry {
  serviceId: string;
  fullName: string;
  rankTitle: string;
  rankCategory: RankCategory;
  unit: string;
}

export const MOCK_REGISTRY: RegistryEntry[] = [
  { serviceId: 'IC-78231K', fullName: 'Arjun Mehta', rankTitle: 'Maj', rankCategory: 'OFFRS', unit: 'Demo Regiment' },
  { serviceId: 'IC-80112M', fullName: 'Neha Sharma', rankTitle: 'Capt', rankCategory: 'OFFRS', unit: 'Demo Signals' },
  { serviceId: 'IC-69954P', fullName: 'Vikram Rathore', rankTitle: 'Lt Col', rankCategory: 'OFFRS', unit: 'Demo Artillery' },
  { serviceId: 'JC-452190P', fullName: 'Rakesh Yadav', rankTitle: 'Sub', rankCategory: 'JCOS', unit: 'Demo Regiment' },
  { serviceId: 'JC-461122L', fullName: 'Gurpreet Singh', rankTitle: 'Nb Sub', rankCategory: 'JCOS', unit: 'Demo Engineers' },
  { serviceId: '15478231F', fullName: 'Manoj Singh', rankTitle: 'Hav', rankCategory: 'ORS', unit: 'Demo Regiment' },
  { serviceId: '15522871W', fullName: 'Anil Kumar', rankTitle: 'Sep', rankCategory: 'ORS', unit: 'Demo Infantry' },
  { serviceId: '15610044H', fullName: 'Pooja Rawat', rankTitle: 'L Nk', rankCategory: 'ORS', unit: 'Demo Medical' },
];

export const DEMO_PASSWORD = 'Demo@1234';
export const ADMIN_PASSWORD = 'Admin@1234';

export type SeedUser = Omit<Profile, 'createdAt'> & { password: string; createdAt: string };

export const SEED_USERS: SeedUser[] = [
  {
    id: 'u-admin',
    fullName: 'Station Admin',
    rankTitle: 'Admin',
    serviceId: 'ADMIN-001',
    rankCategory: 'OFFRS',
    mobile: '9000000001',
    email: 'admin@veercinema.demo',
    role: 'admin',
    verification: 'verified',
    password: ADMIN_PASSWORD,
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'u-arjun',
    fullName: 'Arjun Mehta',
    rankTitle: 'Maj',
    serviceId: 'IC-78231K',
    rankCategory: 'OFFRS',
    unit: 'Demo Regiment',
    mobile: '9876500001',
    email: 'arjun@veercinema.demo',
    role: 'user',
    verification: 'verified',
    password: DEMO_PASSWORD,
    createdAt: '2026-07-04T10:12:00.000Z',
  },
  {
    id: 'u-rakesh',
    fullName: 'Rakesh Yadav',
    rankTitle: 'Sub',
    serviceId: 'JC-452190P',
    rankCategory: 'JCOS',
    unit: 'Demo Regiment',
    mobile: '9876500002',
    email: 'rakesh@veercinema.demo',
    role: 'user',
    verification: 'verified',
    password: DEMO_PASSWORD,
    createdAt: '2026-07-19T16:40:00.000Z',
  },
  {
    id: 'u-manoj',
    fullName: 'Manoj Singh',
    rankTitle: 'Hav',
    serviceId: '15478231F',
    rankCategory: 'ORS',
    unit: 'Demo Regiment',
    mobile: '9876500003',
    email: 'manoj@veercinema.demo',
    role: 'user',
    verification: 'verified',
    password: DEMO_PASSWORD,
    createdAt: '2026-08-02T08:05:00.000Z',
  },
  {
    id: 'u-suresh',
    fullName: 'Suresh Patil',
    rankTitle: 'Nk',
    serviceId: '15599012X',
    rankCategory: 'ORS',
    unit: 'Demo Regiment',
    mobile: '9876500004',
    email: 'suresh@veercinema.demo',
    role: 'user',
    verification: 'pending',
    password: DEMO_PASSWORD,
    createdAt: '2026-09-20T11:30:00.000Z',
  },
];
