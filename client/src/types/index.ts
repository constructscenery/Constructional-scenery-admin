export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

// ── Hero ────────────────────────────────────────────────────────────────────

export interface TrustStat {
  value: string;
  label: string;
}

export interface HeroSection {
  id: number;
  eyebrow: string;
  headline: string;
  rotatingItems: string[];
  bodyText: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
  mediaType: "video" | "image";
  videoUrl?: string;
  videoPoster?: string;
  heroImageUrl?: string;
  trustStats: TrustStat[];
  updatedAt: string;
}

// ── Logo ────────────────────────────────────────────────────────────────────

export interface Logo {
  id: number;
  name: string;
  imageUrl?: string;
  order: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── About ───────────────────────────────────────────────────────────────────

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutPillar {
  title: string;
  description: string;
}

export interface AboutSection {
  id: number;
  headline: string;
  bodyText: string;
  imageUrl: string;
  imageAlt: string;
  stats: AboutStat[];
  pillars: AboutPillar[];
  updatedAt: string;
}

// ── Service ─────────────────────────────────────────────────────────────────

export interface Service {
  id: number;
  title: string;
  description: string;
  iconName: string;
  order: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  name: string;
  type: string;
  services: string;
  year: string;
  slug?: string;
  imageUrl: string;
  span?: string;
  order: number;
  visible: boolean;
  worldId?: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Process ─────────────────────────────────────────────────────────────────

export interface ProcessStep {
  id: number;
  number: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ── Testimonial ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: number;
  text: string;
  name: string;
  role: string;
  imageUrl?: string | null;
  order: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Sustainability ───────────────────────────────────────────────────────────

export interface SustainabilityItem {
  id: number;
  title: string;
  description: string;
  iconName: string;
  order: number;
  sectionId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SustainabilitySection {
  id: number;
  headline: string;
  bodyText: string;
  imageUrl: string;
  imageAlt: string;
  items: SustainabilityItem[];
  updatedAt: string;
}

// ── Contact ─────────────────────────────────────────────────────────────────

export interface ContactSection {
  id: number;
  headline: string;
  bodyText: string;
  cta1Label: string;
  cta1Email: string;
  cta2Label: string;
  cta2Email: string;
  updatedAt: string;
}

// ── Footer ──────────────────────────────────────────────────────────────────

export interface FooterColumnLink {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterColumnLink[];
}

export interface FooterSection {
  id: number;
  brandName: string;
  tagline: string;
  columns: FooterColumn[];
  instagram?: string;
  linkedin?: string;
  vimeo?: string;
  updatedAt: string;
}

// ── World ───────────────────────────────────────────────────────────────────

export interface WorldImage {
  id: number;
  url: string;
  order: number;
  worldId: number;
}

export interface WorldFact {
  id: number;
  label: string;
  value: string;
  order: number;
  worldId: number;
}

export interface WorldCredit {
  id: number;
  role: string;
  name: string;
  order: number;
  worldId: number;
}

export interface World {
  id: number;
  slug: string;
  title: string;
  summary: string;
  year: string;
  tags: string[];
  category: string;
  heroImage: string;
  vimeoId: string;
  intro: string;
  gallery: WorldImage[];
  facts: WorldFact[];
  credits: WorldCredit[];
  order: number;
  visible: boolean;
  projectId?: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── World write payload (sub-arrays omit DB-generated id/worldId) ────────────

export type WorldInput = Omit<Partial<World>, "gallery" | "facts" | "credits"> & {
  gallery?: Omit<WorldImage, "id" | "worldId">[];
  facts?: Omit<WorldFact, "id" | "worldId">[];
  credits?: Omit<WorldCredit, "id" | "worldId">[];
};

// ── Upload ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  publicId: string;
  id: number;
}

// ── Media Library ────────────────────────────────────────────────────────────

export interface MediaFile {
  id: number;
  url: string;
  publicId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardCounts {
  logos: number;
  services: number;
  projects: number;
  processSteps: number;
  testimonials: number;
  worlds: number;
}
