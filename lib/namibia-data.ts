export const NAMIBIA_CENTER: [number, number] = [17.0832, -22.5597];
export const DEFAULT_TRIP_TITLE = "My Trip";
export const LEGACY_DEFAULT_NAMIBIA_TRIP_TITLE = "My Namibia Trip";

export const PLACE_CATEGORIES = [
  "Desert",
  "Wildlife",
  "Coast",
  "Culture",
  "Scenic Drive",
  "Stay",
] as const;

export const EXPLORE_FILTERS = ["All", ...PLACE_CATEGORIES] as const;
export const EXPLORE_DISCOVERY_FILTERS = [
  "Landmarks",
  "Activities",
  "Stays",
] as const;
export const EXPLORE_MAP_PLACE_SLUGS = [
  "sossusvlei-deadvlei",
  "etosha-national-park",
  "swakopmund",
  "sandwich-harbour",
  "skeleton-coast-national-park",
  "spitzkoppe",
  "twyfelfontein",
  "fish-river-canyon",
  "waterberg-plateau",
  "kolmanskop-and-luderitz",
] as const;
export const EXPLORE_DISCOVERY_FILTER_POI_SLUGS = {
  Landmarks: [...EXPLORE_MAP_PLACE_SLUGS],
  Activities: ["swakopmund", "sandwich-harbour", "sossusvlei-deadvlei", "etosha-national-park"],
  Stays: ["spitzkoppe", "swakopmund", "waterberg-plateau", "sossusvlei-deadvlei", "etosha-national-park"],
} as const;

export const TRIP_STATUSES = [
  "draft",
  "planned",
  "active",
  "completed",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
export type ExploreFilter = (typeof EXPLORE_FILTERS)[number];
export type ExploreDiscoveryFilter = (typeof EXPLORE_DISCOVERY_FILTERS)[number];
export type TripStatus = (typeof TRIP_STATUSES)[number];

export type NamibiaPlaceSeed = {
  slug: string;
  title: string;
  region: string;
  country: string;
  category: PlaceCategory;
  summary: string;
  teaser: string;
  description: string;
  coordinates: [number, number];
  heroImage: string;
  galleryImages: string[];
  highlights: string[];
  tags: string[];
  featured: boolean;
  rating: string;
  estimatedVisitDuration: string;
  bestTimeToVisit: string;
  roadAccessNote: string;
  driveTimeFromWindhoek: string;
  sortOrder: number;
};

export const namibiaPlaceSeed: NamibiaPlaceSeed[] = [
  {
    slug: "sossusvlei-deadvlei",
    title: "Sossusvlei and Deadvlei",
    region: "Namib-Naukluft",
    country: "Namibia",
    category: "Desert",
    summary:
      "The classic Namibia sunrise stop: red dunes, white clay pans, and easy icon moments from first light through late morning.",
    teaser:
      "Perfect for a sunrise-led day with Dune 45, Deadvlei, and Sesriem layered into one desert loop.",
    description:
      "Sossusvlei is the signature desert stop on most self-drive Namibia routes. Travelers usually enter early, climb a dune at first light, and continue into Deadvlei for the stark pan and dead camel thorn trees that define the landscape.",
    coordinates: [15.2874, -24.7318],
    heroImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Dune 45", "Deadvlei", "Sesriem Canyon", "Sunrise entry"],
    tags: ["Photography", "Sunrise", "Desert", "Iconic"],
    featured: true,
    rating: "4.9",
    estimatedVisitDuration: "6-8 hours",
    bestTimeToVisit: "May to September for cooler mornings and clear skies.",
    roadAccessNote:
      "The final stretch to Sossusvlei can require the 4x4 shuttle if you are not driving a capable vehicle.",
    driveTimeFromWindhoek: "5h 30m",
    sortOrder: 1,
  },
  {
    slug: "etosha-national-park",
    title: "Etosha National Park",
    region: "Etosha",
    country: "Namibia",
    category: "Wildlife",
    summary:
      "Namibia's flagship safari circuit, built around huge salt-pan scenery and reliable wildlife viewing around waterholes.",
    teaser:
      "A self-drive favorite with strong late-afternoon game viewing, classic rest camps, and easy stop sequencing.",
    description:
      "Etosha is the country's best-known wildlife destination and works especially well for road-trippers because the route is intuitive and the main camp network is easy to build into a multi-day loop. The experience is less about dense bush and more about scanning waterholes and wide open horizons.",
    coordinates: [15.9129, -19.1766],
    heroImage:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Okaukuejo waterhole", "Halali", "Salt pan viewpoints", "Self-drive safari"],
    tags: ["Safari", "Wildlife", "Road Trip", "Waterholes"],
    featured: true,
    rating: "4.9",
    estimatedVisitDuration: "2-3 days",
    bestTimeToVisit: "Dry season from June to October for concentrated wildlife sightings.",
    roadAccessNote:
      "Distances inside the park are longer than they look, so plan fuel and gate times carefully.",
    driveTimeFromWindhoek: "4h 45m",
    sortOrder: 2,
  },
  {
    slug: "swakopmund",
    title: "Swakopmund",
    region: "Central Coast",
    country: "Namibia",
    category: "Coast",
    summary:
      "The easiest coastal reset on the Namibia circuit, balancing ocean air, practical services, and day-trip access.",
    teaser:
      "Use Swakopmund as a recovery stop between desert legs or as a launch point for dunes, kayaking, and food.",
    description:
      "Swakopmund is where many Namibia itineraries catch their breath. It is a useful anchor between inland driving days, with lodging, cafes, and adventure departures that keep the route flexible without losing momentum.",
    coordinates: [14.5266, -22.6784],
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Waterfront stays", "Adventure tour base", "Cafe strip", "Jetty sunsets"],
    tags: ["Coast", "Food", "Basecamp", "Ocean"],
    featured: true,
    rating: "4.7",
    estimatedVisitDuration: "1-2 days",
    bestTimeToVisit: "Year-round, with cooler and windier coastal weather than inland Namibia.",
    roadAccessNote:
      "Fog and crosswinds are common on the coast, so keep your driving days flexible.",
    driveTimeFromWindhoek: "4h 15m",
    sortOrder: 3,
  },
  {
    slug: "sandwich-harbour",
    title: "Sandwich Harbour",
    region: "Walvis Bay Coast",
    country: "Namibia",
    category: "Coast",
    summary:
      "A dramatic meeting of dunes and Atlantic shoreline, best visited as a guided coastal detour from Walvis Bay or Swakopmund.",
    teaser:
      "This is the big visual coastal excursion if you want something more wild than a town stop.",
    description:
      "Sandwich Harbour gives the coast its most cinematic shape, where dunes collapse toward the sea and the route itself feels like the attraction. Most travelers book a local guide because timing, tides, and sand conditions matter.",
    coordinates: [14.5362, -23.3702],
    heroImage:
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Dune meets sea", "Guided 4x4 trip", "Birdlife lagoon", "Big coastal views"],
    tags: ["Adventure", "Coast", "4x4", "Photography"],
    featured: true,
    rating: "4.8",
    estimatedVisitDuration: "Half day",
    bestTimeToVisit: "Morning departures usually give the smoothest light and cooler sand.",
    roadAccessNote:
      "Treat this as a guided stop unless you are highly confident with tidal sand driving.",
    driveTimeFromWindhoek: "4h 30m",
    sortOrder: 4,
  },
  {
    slug: "skeleton-coast-national-park",
    title: "Skeleton Coast National Park",
    region: "Skeleton Coast",
    country: "Namibia",
    category: "Scenic Drive",
    summary:
      "A remote Atlantic stretch known for fog, wreckage, and the stark feeling of driving into Namibia's emptiest edge.",
    teaser:
      "Best added when the trip is stretching north and you want more remoteness than the central coast offers.",
    description:
      "The Skeleton Coast is less about one landmark and more about atmosphere: sparse access, cold ocean air, seals, wreck remnants, and long low-traffic drives. It works best for travelers who want a moodier extension of the classic circuit.",
    coordinates: [13.9162, -20.8915],
    heroImage:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Shipwreck lookouts", "Seal colonies", "Fog belt", "Remote coastal drive"],
    tags: ["Remote", "Atlantic", "Scenic Drive", "Adventure"],
    featured: false,
    rating: "4.7",
    estimatedVisitDuration: "1 day",
    bestTimeToVisit: "Cooler months from April to October suit long driving days.",
    roadAccessNote:
      "This is a long-distance coastal detour, so carry fuel discipline and keep daylight margins.",
    driveTimeFromWindhoek: "6h 30m",
    sortOrder: 5,
  },
  {
    slug: "spitzkoppe",
    title: "Spitzkoppe",
    region: "Erongo",
    country: "Namibia",
    category: "Stay",
    summary:
      "Granite domes, boulder scrambles, and one of the most memorable overnight landscapes in Namibia.",
    teaser:
      "The best add-on when you want one night that feels raw, scenic, and very different from the dunes.",
    description:
      "Spitzkoppe is a natural pause point between central Namibia and the coast. Travelers come for golden-hour rock color, night skies, and the feeling of camping or staying close to huge granite formations rather than in a structured resort rhythm.",
    coordinates: [15.1975, -21.8265],
    heroImage:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Rock arch", "Camping under stars", "Sunset granite glow", "Short hikes"],
    tags: ["Camping", "Stargazing", "Granite", "Overnight"],
    featured: true,
    rating: "4.8",
    estimatedVisitDuration: "1 night",
    bestTimeToVisit: "April to September for cooler hiking temperatures and clearer skies.",
    roadAccessNote:
      "Facilities are limited compared with towns, so stock up before arriving.",
    driveTimeFromWindhoek: "3h 20m",
    sortOrder: 6,
  },
  {
    slug: "twyfelfontein",
    title: "Twyfelfontein",
    region: "Damaraland",
    country: "Namibia",
    category: "Culture",
    summary:
      "A UNESCO-listed rock engraving site that gives the Namibia road trip a strong cultural and archaeological stop.",
    teaser:
      "Add this when you want the route to hold more than landscapes and wildlife.",
    description:
      "Twyfelfontein is one of Africa's best-known rock art sites and adds an entirely different tempo to a Namibia itinerary. It pairs well with Damaraland driving days and helps balance the trip with deeper cultural context.",
    coordinates: [14.3717, -20.5965],
    heroImage:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Rock engravings", "UNESCO site", "Guided heritage walk", "Damaraland stop"],
    tags: ["Culture", "UNESCO", "Rock Art", "History"],
    featured: true,
    rating: "4.7",
    estimatedVisitDuration: "2-3 hours",
    bestTimeToVisit: "Shoulder seasons offer the most comfortable walking temperatures.",
    roadAccessNote:
      "Pair it with another Damaraland overnight rather than treating it as a rushed drive-by.",
    driveTimeFromWindhoek: "5h 45m",
    sortOrder: 7,
  },
  {
    slug: "fish-river-canyon",
    title: "Fish River Canyon",
    region: "Karas",
    country: "Namibia",
    category: "Scenic Drive",
    summary:
      "A huge southern detour with big-sky geology, lookouts, and a slower long-drive rhythm than the classic central circuit.",
    teaser:
      "Best for longer trips where you want to push beyond the main north-west loop.",
    description:
      "Fish River Canyon is one of the most dramatic landscape stops in southern Africa and changes the pacing of the trip because of its distance. It works well for travelers building a fuller Namibia arc rather than a short classic circuit.",
    coordinates: [17.6473, -27.6019],
    heroImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Main viewpoint", "Canyon rim drive", "Southern detour", "Sunrise lookout"],
    tags: ["Road Trip", "South", "Detour", "Landscape"],
    featured: false,
    rating: "4.8",
    estimatedVisitDuration: "Half day to 1 day",
    bestTimeToVisit: "April to September for cooler conditions and clearer long views.",
    roadAccessNote:
      "This stop is best when the overall itinerary is already southbound, not as a rushed last-minute add-on.",
    driveTimeFromWindhoek: "8h 15m",
    sortOrder: 8,
  },
  {
    slug: "waterberg-plateau",
    title: "Waterberg Plateau",
    region: "Otjozondjupa",
    country: "Namibia",
    category: "Wildlife",
    summary:
      "A greener inland stop with plateau views, short hikes, and an easy way to break the long central drive.",
    teaser:
      "Useful as a one-night pacing stop between Windhoek and northern Namibia.",
    description:
      "Waterberg shifts the palette from open desert and gravel to red cliffs and denser vegetation. It is a practical stop for travelers who want the itinerary to flow more gently into Etosha or back toward Windhoek.",
    coordinates: [17.2336, -20.4249],
    heroImage:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Plateau lookout", "Short hikes", "Wildlife reserve", "Pacing stop"],
    tags: ["Wildlife", "Hiking", "Lookout", "Overnight"],
    featured: false,
    rating: "4.6",
    estimatedVisitDuration: "Half day to 1 night",
    bestTimeToVisit: "March to October for comfortable hiking weather.",
    roadAccessNote:
      "Treat Waterberg as a rhythm stop that improves the overall drive rather than a hurried same-day add-on.",
    driveTimeFromWindhoek: "3h 20m",
    sortOrder: 9,
  },
  {
    slug: "kolmanskop-and-luderitz",
    title: "Kolmanskop and Luderitz",
    region: "South Coast",
    country: "Namibia",
    category: "Culture",
    summary:
      "A photogenic ghost-town and coastal town pairing that gives the south a completely different texture from the desert core.",
    teaser:
      "Great for travelers stretching the trip south and wanting something more historical and atmospheric.",
    description:
      "Kolmanskop and nearby Luderitz add architecture, desert history, and ocean mood to the route. The stop works best when you have enough time to let the southern coast feel distinct instead of squeezing it between core highlights.",
    coordinates: [15.2286, -26.7034],
    heroImage:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Ghost town photography", "Luderitz coast", "Colonial architecture", "South coast detour"],
    tags: ["Culture", "Photography", "History", "South"],
    featured: false,
    rating: "4.6",
    estimatedVisitDuration: "Half day to 1 day",
    bestTimeToVisit: "Year-round, though the coast can be windy and cool.",
    roadAccessNote:
      "Give yourself enough daylight because this region feels better when it is not rushed.",
    driveTimeFromWindhoek: "7h 40m",
    sortOrder: 10,
  },
  {
    slug: "cape-cross-seal-reserve",
    title: "Cape Cross Seal Reserve",
    region: "Skeleton Coast South",
    country: "Namibia",
    category: "Coast",
    summary:
      "A wild-feeling coastal wildlife stop with huge seal colonies and an easy add-on while moving north or south along the Atlantic.",
    teaser:
      "The best quick wildlife stop to combine with the coast before committing to a deeper Skeleton Coast drive.",
    description:
      "Cape Cross is one of the simplest ways to add a memorable Atlantic wildlife stop without reshaping the entire itinerary. It works well as a short, sensory-heavy break on the coast road between Swakopmund and the Skeleton Coast region.",
    coordinates: [13.9515, -21.7759],
    heroImage:
      "https://images.unsplash.com/photo-1501706362039-c6e80948f11f?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80",
    ],
    highlights: ["Seal colony", "Atlantic stop", "Easy coast detour", "Quick nature break"],
    tags: ["Wildlife", "Coast", "Seals", "Day Stop"],
    featured: false,
    rating: "4.5",
    estimatedVisitDuration: "1-2 hours",
    bestTimeToVisit: "Year-round, with cooler conditions on the coast than inland.",
    roadAccessNote:
      "This is an easy same-day detour from the central coast and works best when paired with Swakopmund.",
    driveTimeFromWindhoek: "5h 15m",
    sortOrder: 11,
  },
];
