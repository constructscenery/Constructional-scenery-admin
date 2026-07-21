import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with current portfolio content...");

  // ── Admin User ───────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "changeme123", 12);
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@constructscenery.co.uk" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? "admin@constructscenery.co.uk",
      passwordHash,
      name: process.env.ADMIN_NAME ?? "Admin",
    },
  });
  console.log("✓ Admin user");

  // ── Hero Section ─────────────────────────────────────────────────────────────
  await prisma.heroSection.deleteMany();
  await prisma.heroSection.create({
    data: {
      eyebrow: "UK Scenic Construction · Est. 2003",
      headline: "We Build Worlds",
      rotatingItems: ["For Film.", "For Television.", "For Brands.", "For Events."],
      bodyText:
        "For over 20 years we've partnered with production companies, studios, agencies and creatives to bring ambitious ideas to life through world-class scenic construction.",
      cta1Label: "Discuss your project",
      cta1Href: "#contact",
      cta2Label: "Explore portfolio",
      cta2Href: "#work",
      videoUrl: "/videos/hero-set.mp4",
      videoPoster: "/assets/hero-set.jpg",
      trustStats: [
        { value: "20+", label: "Years experience" },
        { value: "500+", label: "Projects delivered" },
        { value: "UK", label: "Wide coverage" },
        { value: "BAFTA", label: "Award winning" },
      ],
    },
  });
  console.log("✓ Hero section");

  // ── Logos ─────────────────────────────────────────────────────────────────────
  await prisma.logo.deleteMany();
  const logoNames = ["BBC", "ITV", "Netflix", "Sky", "Channel 4", "Amazon Studios", "Apple TV+", "Disney+"];
  await prisma.logo.createMany({
    data: logoNames.map((name, order) => ({ name, order, visible: true })),
  });
  console.log("✓ Logos");

  // ── About Section ─────────────────────────────────────────────────────────────
  await prisma.aboutSection.deleteMany();
  await prisma.aboutSection.create({
    data: {
      headline: "From concept to camera ready.",
      bodyText:
        "We are a workshop of designers, fabricators, scenic artists and project leads. Every brief begins with a conversation and ends with something real on stage, on location, or in the lens. Craft is the point.",
      imageUrl: "/assets/about-craft.jpg",
      imageAlt: "A scenic carpenter shaping a gilded panel in the workshop",
      stats: [
        { value: "20+", label: "Years" },
        { value: "120", label: "Craftspeople" },
        { value: "500+", label: "Builds" },
        { value: "48hr", label: "Turnaround" },
      ],
      pillars: [
        { title: "Scenic Construction", description: "Structural builds engineered to camera tolerances." },
        { title: "Set Fabrication", description: "Bespoke joinery, sculpture, metal & resin work." },
        { title: "Scenic Finishing", description: "Painted finishes, ageing, gilding, plasterwork." },
        { title: "Installation", description: "On-site teams, rigging, transport, deinstall." },
        { title: "Production Support", description: "Standby crew, modifications, problem solving." },
      ],
    },
  });
  console.log("✓ About section");

  // ── Services ──────────────────────────────────────────────────────────────────
  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: [
      { title: "Film Set Construction", description: "Studio and location builds for feature productions, engineered to spec.", iconName: "Clapperboard", order: 0 },
      { title: "TV Production Sets", description: "Long-running series, dramas and entertainment formats.", iconName: "Tv", order: 1 },
      { title: "Commercial Builds", description: "Hero sets and product environments for global campaigns.", iconName: "Megaphone", order: 2 },
      { title: "Experiential Events", description: "Brand activations and immersive installations.", iconName: "Sparkles", order: 3 },
      { title: "Scenic Painting", description: "Trompe-l'œil, ageing, period finishes and large-scale backings.", iconName: "Paintbrush2", order: 4 },
      { title: "Bespoke Fabrication", description: "Sculptural builds, props, metalwork and prototyping.", iconName: "Hammer", order: 5 },
    ],
  });
  console.log("✓ Services");

  // ── Projects (Portfolio Grid) ─────────────────────────────────────────────────
  await prisma.project.deleteMany();
  await prisma.project.createMany({
    data: [
      { name: "Clayface", type: "DC Feature Film", services: "Sculpting · Standby · Hero build", year: "2025", slug: "clayface", imageUrl: "/assets/project-3.jpg", span: "row-span-2", order: 0 },
      { name: "Aurora Pavilion", type: "Brand Activation", services: "Fabrication · Installation", year: "2025", imageUrl: "/assets/project-2.jpg", order: 1 },
      { name: "You", type: "Netflix Series", services: "Recurring interiors · Standby", year: "2024", slug: "you", imageUrl: "/assets/project-5.jpg", span: "row-span-2", order: 2 },
      { name: "Bloom Couture", type: "Commercial", services: "Scenic · Sculptural backdrop", year: "2024", imageUrl: "/assets/project-4.jpg", order: 3 },
      { name: "Trespass Against Us", type: "Feature Film", services: "Location build · Scenic finishing", year: "2024", slug: "trespass-against-us", imageUrl: "/assets/project-1.jpg", span: "row-span-2", order: 4 },
      { name: "Vanguard Awards", type: "Live Event", services: "Stage architecture", year: "2024", imageUrl: "/assets/project-6.jpg", order: 5 },
      { name: "The Late Edit", type: "Studio Format", services: "LED set · Furniture", year: "2025", imageUrl: "/assets/project-7.jpg", order: 6 },
      { name: "Maison Pop-Up", type: "Experiential Retail", services: "Sculptural fabrication", year: "2024", imageUrl: "/assets/project-8.jpg", span: "row-span-2", order: 7 },
    ],
  });
  console.log("✓ Projects");

  // ── Process Steps ─────────────────────────────────────────────────────────────
  await prisma.processStep.deleteMany();
  await prisma.processStep.createMany({
    data: [
      { number: "01", title: "Discovery", description: "We sit with directors, designers and producers to understand the vision, the schedule, and the budget.", order: 0 },
      { number: "02", title: "Design Collaboration", description: "Working drawings, materials, finishes and engineering — agreed before a single cut is made.", order: 1 },
      { number: "03", title: "Fabrication", description: "Carpentry, metal, sculpture, paint and finishing all happen under one roof in our UK workshop.", order: 2 },
      { number: "04", title: "Installation", description: "Our install crews deliver, rig and finish on stage or location to your call sheet.", order: 3 },
      { number: "05", title: "Production Ready", description: "Standby crew stay through shoot, ready for changes, repairs and last-minute creative pivots.", order: 4 },
    ],
  });
  console.log("✓ Process steps");

  // ── Testimonials ──────────────────────────────────────────────────────────────
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: [
      { text: "They built a four-storey period interior in eight weeks and made it look like it had stood for two hundred years. Extraordinary discipline.", name: "Eleanor Whitfield", role: "Production Designer, BBC Studios", imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", order: 0 },
      { text: "Calm under pressure, brilliant on the floor. Construct Scenery is the team I call first on every commercial.", name: "Marcus Bellamy", role: "Executive Producer, RSA Films", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", order: 1 },
      { text: "The fabrication detail on our hero set was indistinguishable from the real thing in 8K. Truly camera-ready craft.", name: "Priya Anand", role: "Art Director, Netflix", imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop", order: 2 },
      { text: "From sketch to install in six weeks across three sites. Their delivery model is in a class of its own.", name: "James Hollis", role: "Creative Director, AMV BBDO", imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", order: 3 },
      { text: "The standby crew quietly solved problems we hadn't even spotted. That's the kind of partnership you want on a long shoot.", name: "Sofia Marquez", role: "Production Designer, Sky Originals", imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", order: 4 },
      { text: "Sustainable, beautifully made, on schedule. We've worked with most UK shops — these are the ones we keep returning to.", name: "Oliver Bennet", role: "Head of Production, Channel 4", imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop", order: 5 },
      { text: "Our experiential build needed sculptural precision and theatrical flair. They delivered both, calmly.", name: "Hannah Reeves", role: "ECD, Jack Morton Worldwide", imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", order: 6 },
      { text: "I trust them with the riskiest creative I write. They make the impossible feel scheduled.", name: "Daniel Fox", role: "Director, Independent", imageUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop", order: 7 },
      { text: "Beautifully detailed finishes on a brutal turnaround. The DOP was thrilled. So were we.", name: "Amelia Park", role: "Production Designer, ITV Drama", imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop", order: 8 },
    ],
  });
  console.log("✓ Testimonials");

  // ── Sustainability Section ────────────────────────────────────────────────────
  await prisma.sustainabilityItem.deleteMany();
  await prisma.sustainabilitySection.deleteMany();
  await prisma.sustainabilitySection.create({
    data: {
      headline: "Building responsibly.",
      bodyText:
        "Scenic construction has a footprint. We've spent a decade reducing ours — through materials we choose, the way we build, and what happens after wrap.",
      imageUrl: "/assets/sustainability.jpg",
      imageAlt: "Reclaimed timber stacked in a sustainable scenic workshop",
      items: {
        create: [
          { title: "Sustainable sourcing", description: "FSC-certified timber and responsibly sourced materials as standard.", iconName: "TreePine", order: 0 },
          { title: "Material recycling", description: "A circular workshop. We strip, store and rebuild — not skip.", iconName: "Recycle", order: 1 },
          { title: "Reduced waste", description: "Digital cutting, modular builds and shared component libraries.", iconName: "Wind", order: 2 },
          { title: "Carbon commitment", description: "Measuring and reducing our build footprint, project by project.", iconName: "Leaf", order: 3 },
        ],
      },
    },
  });
  console.log("✓ Sustainability section");

  // ── Contact Section ───────────────────────────────────────────────────────────
  await prisma.contactSection.deleteMany();
  await prisma.contactSection.create({
    data: {
      headline: "Let's build something extraordinary.",
      bodyText:
        "Whether you're producing a television series, building a commercial campaign, or creating an immersive experience, we're ready to bring your vision to life.",
      cta1Label: "Start your project",
      cta1Email: "hello@constructscenery.co.uk",
      cta2Label: "Book a consultation",
      cta2Email: "hello@constructscenery.co.uk",
    },
  });
  console.log("✓ Contact section");

  // ── Bio Section ───────────────────────────────────────────────────────────────
  await prisma.bioSection.deleteMany();
  await prisma.bioSection.create({
    data: {
      name: "Construct Scenery",
      role: "Premium Scenic Construction",
      description: "UK-based scenic construction for film, television, brands, and experiential events. We build worlds.",
      imageUrl: "/assets/about-craft.jpg",
      links: [
        { label: "Website", url: "https://constructscenery.co.uk" },
        { label: "Instagram", url: "https://instagram.com/constructscenery" }
      ],
    },
  });
  console.log("✓ Bio section");

  // ── Footer ────────────────────────────────────────────────────────────────────
  await prisma.footerSection.deleteMany();
  await prisma.footerSection.create({
    data: {
      brandName: "Construct/Scenery",
      tagline: "The UK's premium scenic construction partner. Workshop in London. Builds worldwide.",
      columns: [
        { title: "Studio", links: ["About", "Craft", "Workshop", "Careers"] },
        { title: "Capabilities", links: ["Film", "Television", "Commercial", "Experiential"] },
        { title: "Work", links: ["Projects", "Case Studies", "Press", "Awards"] },
        { title: "Contact", links: ["Enquiries", "Locations", "Press", "Newsletter"] },
      ],
      instagram: "",
      linkedin: "",
      vimeo: "",
    },
  });
  console.log("✓ Footer");

  // ── Worlds (Case Studies) ─────────────────────────────────────────────────────
  await prisma.worldResult.deleteMany();
  await prisma.worldProcess.deleteMany();
  await prisma.worldCredit.deleteMany();
  await prisma.worldFact.deleteMany();
  await prisma.worldImage.deleteMany();
  await prisma.world.deleteMany();

  // Clayface
  await prisma.world.create({
    data: {
      slug: "clayface",
      title: "Clayface",
      summary: "Forging the textured underworld of a DC feature villain.",
      role: "Scenic Construction · Sculpting · Standby",
      year: "2025",
      tags: ["Feature Film", "DC", "Practical Build"],
      category: "Feature Film",
      heroImage: "/assets/project-3.jpg",
      vimeoId: "76979871",
      intro:
        "A six-month build across two sound stages, translating James Price's production design into a fully practical, camera-ready world. Every surface was sculpted, aged and finished in-house — from the cathedral-scale antagonist lair down to the smallest hand-cast prop.",
      order: 0,
      gallery: {
        create: [
          { url: "/assets/project-3.jpg", order: 0 },
          { url: "/assets/project-1.jpg", order: 1 },
          { url: "/assets/project-5.jpg", order: 2 },
          { url: "/assets/project-2.jpg", order: 3 },
          { url: "/assets/project-4.jpg", order: 4 },
          { url: "/assets/project-6.jpg", order: 5 },
          { url: "/assets/project-8.jpg", order: 6 },
        ],
      },
      facts: {
        create: [
          { label: "Stages", value: "2", order: 0 },
          { label: "Build weeks", value: "26", order: 1 },
          { label: "Sculpted sqm", value: "1,800", order: 2 },
          { label: "Crew at peak", value: "64", order: 3 },
        ],
      },
      credits: {
        create: [
          { role: "Director", name: "James Watkins", order: 0 },
          { role: "Producer", name: "James Gunn", order: 1 },
          { role: "Production Design", name: "James Price", order: 2 },
        ],
      },
      process: {
        create: [
          {
            title: "From maquette to monument",
            body: "Starting from the art department's quarter-scale maquettes, our sculpting team scaled forms in EPS and hard-coated for camera durability — preserving every gestural mark of the original.",
            imageUrl: "/assets/about-craft.jpg",
            order: 0,
          },
          {
            title: "A palette of decay",
            body: "Twelve bespoke paint and patina recipes were developed with the DOP, calibrated under the film's tungsten and HMI mix so the surface read the same way wet, dry and dust-blown.",
            imageUrl: "/assets/project-5.jpg",
            order: 1,
          },
          {
            title: "Modular for the schedule",
            body: "The hero set was engineered in tessellating sections so the unit could re-block scenes in hours rather than days. Standby scenics travelled with the unit through every shoot week.",
            imageUrl: "/assets/project-1.jpg",
            order: 2,
          },
        ],
      },
      results: {
        create: [
          { value: "26wk", label: "Build", order: 0 },
          { value: "1,800m²", label: "Sculpted", order: 1 },
          { value: "0", label: "Lost shoot days", order: 2 },
          { value: "100%", label: "In-house", order: 3 },
        ],
      },
    },
  });

  // You (Netflix)
  await prisma.world.create({
    data: {
      slug: "you",
      title: "You",
      summary: "Five interiors. One unreliable narrator. A returning Netflix world.",
      role: "Set Build · Dressing · Standby Scenics",
      year: "2024",
      tags: ["Netflix", "Series", "Returning World"],
      category: "TV Series",
      heroImage: "/assets/project-5.jpg",
      vimeoId: "76979871",
      intro:
        "Working alongside production designer Kevin Phipps, we delivered five recurring interiors for the season — each engineered to wild for camera and re-dressable across multiple narrative beats. Continuity was protected from block one through to wrap.",
      order: 1,
      gallery: {
        create: [
          { url: "/assets/project-5.jpg", order: 0 },
          { url: "/assets/project-7.jpg", order: 1 },
          { url: "/assets/project-2.jpg", order: 2 },
          { url: "/assets/project-8.jpg", order: 3 },
          { url: "/assets/project-1.jpg", order: 4 },
          { url: "/assets/project-4.jpg", order: 5 },
          { url: "/assets/project-3.jpg", order: 6 },
        ],
      },
      facts: {
        create: [
          { label: "Recurring sets", value: "5", order: 0 },
          { label: "Block schedule", value: "18 wks", order: 1 },
          { label: "Wild walls", value: "42", order: 2 },
          { label: "Re-dresses", value: "23", order: 3 },
        ],
      },
      credits: {
        create: [
          { role: "Director", name: "John Scott", order: 0 },
          { role: "Producer", name: "Penn Badgley", order: 1 },
          { role: "Co-Executive Producer", name: "Matthew Patnick", order: 2 },
          { role: "Production Design", name: "Kevin Phipps", order: 3 },
        ],
      },
      process: {
        create: [
          {
            title: "Designed to wild",
            body: "Every wall, ceiling piece and unit was specified for fly-out access. Camera operators could choose any angle on any day without a rebuild — a quiet efficiency that paid back across the block.",
            imageUrl: "/assets/project-7.jpg",
            order: 0,
          },
          {
            title: "Re-dressable by design",
            body: "Surface finishes were layered so the same hero room could be aged forward and pulled back across timelines — a clean continuity tool for the edit.",
            imageUrl: "/assets/project-2.jpg",
            order: 1,
          },
        ],
      },
      results: {
        create: [
          { value: "5", label: "Hero sets", order: 0 },
          { value: "18wk", label: "Block", order: 1 },
          { value: "23", label: "Re-dresses", order: 2 },
          { value: "0", label: "Reshoots", order: 3 },
        ],
      },
    },
  });

  // Trespass Against Us
  await prisma.world.create({
    data: {
      slug: "trespass-against-us",
      title: "Trespass Against Us",
      summary: "A Cotswolds traveller world built honestly, weathered authentically.",
      role: "Exterior Build · Vehicle Dressing · Scenic Finishing",
      year: "2024",
      tags: ["Feature Film", "Location Build", "Period"],
      category: "Feature Film",
      heroImage: "/assets/project-1.jpg",
      vimeoId: "76979871",
      intro:
        "An on-location field build with Nick Palmer's design team — caravans, lean-tos, scrap mountains and lived-in trackways. Every element was constructed with honest materials and aged on-site so the camera never had to look twice.",
      order: 2,
      gallery: {
        create: [
          { url: "/assets/project-1.jpg", order: 0 },
          { url: "/assets/project-6.jpg", order: 1 },
          { url: "/assets/project-4.jpg", order: 2 },
          { url: "/assets/project-3.jpg", order: 3 },
          { url: "/assets/project-8.jpg", order: 4 },
          { url: "/assets/project-5.jpg", order: 5 },
          { url: "/assets/project-2.jpg", order: 6 },
        ],
      },
      facts: {
        create: [
          { label: "On location", value: "8 wks", order: 0 },
          { label: "Structures", value: "31", order: 1 },
          { label: "Vehicles dressed", value: "14", order: 2 },
          { label: "Weathering passes", value: "4", order: 3 },
        ],
      },
      credits: {
        create: [
          { role: "Director", name: "Adam Smith", order: 0 },
          { role: "Producer", name: "Andrea Calderwood", order: 1 },
          { role: "Producer", name: "Gail Egan", order: 2 },
          { role: "Production Design", name: "Nick Palmer", order: 3 },
        ],
      },
      process: {
        create: [
          {
            title: "Honest materials",
            body: "Sourced reclaimed timber, scrap steel and salvaged vehicle parts from within fifty miles of the unit base. The set was the location — we just gave it a deeper history.",
            imageUrl: "/assets/project-6.jpg",
            order: 0,
          },
          {
            title: "Weathering as a discipline",
            body: "Four full weathering passes were scheduled across the build — sun, rain, dust and human wear. Each pass was approved by the DOP under shoot conditions, not workshop light.",
            imageUrl: "/assets/project-4.jpg",
            order: 1,
          },
          {
            title: "Strike without trace",
            body: "Every fixing was reversible. The field returned to its tenant farmer in better condition than we'd found it — a working principle for every location we touch.",
            imageUrl: "/assets/sustainability.jpg",
            order: 2,
          },
        ],
      },
      results: {
        create: [
          { value: "8wk", label: "On location", order: 0 },
          { value: "31", label: "Built", order: 1 },
          { value: "100%", label: "Reclaimed timber", order: 2 },
          { value: "0", label: "Site damage", order: 3 },
        ],
      },
    },
  });
  console.log("✓ Worlds (case studies)");

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
