export type ExploreCategory =
  | "Wildlife"
  | "Desert"
  | "Coast"
  | "Stay"
  | "Scenic Drive";

export type ExplorePlace = {
  slug: string;
  title: string;
  region: string;
  category: ExploreCategory;
  badge: string;
  rating: string;
  driveTime: string;
  summary: string;
  teaser: string;
  note: string;
  top: string;
  left: string;
  emphasis?: boolean;
  background: string;
  highlights: string[];
  tags: string[];
  featured: boolean;
};

export const exploreFilters: Array<ExploreCategory | "All"> = [
  "All",
  "Wildlife",
  "Desert",
  "Coast",
  "Stay",
  "Scenic Drive",
];

export const explorePlaces: ExplorePlace[] = [
  {
    slug: "sossusvlei-dunes",
    title: "Sossusvlei Dunes",
    region: "Namib-Naukluft",
    category: "Desert",
    badge: "Sunrise icon",
    rating: "4.9",
    driveTime: "5h from Windhoek",
    summary:
      "Towering red dunes, clean boardwalk access, and the kind of sunrise light that makes the whole basin feel unreal.",
    teaser: "Dune 45, Deadvlei, and easy desert photography loops.",
    note: "Sunrise",
    top: "63%",
    left: "31%",
    emphasis: true,
    background: "rgba(244, 195, 132, 0.96)",
    highlights: ["Dune 45", "Deadvlei", "Guided dawn entry"],
    tags: ["Photography", "Sunrise", "Iconic"],
    featured: true,
  },
  {
    slug: "etosha-salt-pan",
    title: "Etosha Salt Pan",
    region: "Etosha National Park",
    category: "Wildlife",
    badge: "Game drive",
    rating: "4.8",
    driveTime: "4h 45m from Windhoek",
    summary:
      "Waterholes, huge skies, and a reliable wildlife circuit that fits road-trippers without heavy planning.",
    teaser: "Self-drive loops, lodge stops, and late-afternoon sightings.",
    note: "Wildlife",
    top: "24%",
    left: "47%",
    background: "rgba(227, 223, 182, 0.96)",
    highlights: ["Okaukuejo", "Halali", "Waterhole circuit"],
    tags: ["Safari", "Self-drive", "Big sky"],
    featured: true,
  },
  {
    slug: "skeleton-coast-gate",
    title: "Skeleton Coast Gate",
    region: "Skeleton Coast",
    category: "Coast",
    badge: "Remote",
    rating: "4.7",
    driveTime: "6h 30m from Windhoek",
    summary:
      "A dramatic transition from gravel desert to foggy Atlantic shoreline with wrecks, seals, and stark emptiness.",
    teaser: "Best for travelers pushing north after Swakopmund.",
    note: "Fog belt",
    top: "22%",
    left: "18%",
    background: "rgba(116, 162, 178, 0.96)",
    highlights: ["Shipwreck viewpoints", "Coastal fog", "Remote access"],
    tags: ["Remote", "Atlantic", "Adventure"],
    featured: true,
  },
  {
    slug: "spitzkoppe-camps",
    title: "Spitzkoppe Camps",
    region: "Erongo",
    category: "Stay",
    badge: "Camp under stars",
    rating: "4.8",
    driveTime: "3h 20m from Windhoek",
    summary:
      "Granite domes, boulder hikes, and one of the strongest overnight landscapes in Namibia.",
    teaser: "Wild camping energy with easier access than it looks.",
    note: "Camping",
    top: "45%",
    left: "28%",
    background: "rgba(214, 176, 137, 0.95)",
    highlights: ["Rock arch", "Night sky", "Sunset scramble"],
    tags: ["Camping", "Stargazing", "Granite"],
    featured: false,
  },
  {
    slug: "swakopmund-waterfront",
    title: "Swakopmund Waterfront",
    region: "Central Coast",
    category: "Coast",
    badge: "Reset stop",
    rating: "4.6",
    driveTime: "4h 10m from Windhoek",
    summary:
      "A practical coastal base for food, rest, and launching quad biking, kayaking, or Sandwich Harbour day trips.",
    teaser: "Great midpoint when the route needs one easier night.",
    note: "Town base",
    top: "56%",
    left: "17%",
    background: "rgba(150, 211, 229, 0.94)",
    highlights: ["Oceanfront stay", "Cafe strip", "Day-trip hub"],
    tags: ["Food", "Basecamp", "Ocean"],
    featured: false,
  },
  {
    slug: "fish-river-canyon-viewpoint",
    title: "Fish River Canyon",
    region: "South Namibia",
    category: "Scenic Drive",
    badge: "Big detour",
    rating: "4.8",
    driveTime: "8h 20m from Windhoek",
    summary:
      "A vast southern loop with lookout stops, stark geology, and slower road-trip pacing.",
    teaser: "Worth adding when the trip stretches beyond the classic north-west circuit.",
    note: "Detour",
    top: "83%",
    left: "51%",
    background: "rgba(203, 167, 130, 0.94)",
    highlights: ["Main viewpoint", "Canyon rim", "Long-form drive"],
    tags: ["Detour", "Road trip", "South"],
    featured: false,
  },
];

export const exploreMarkers = explorePlaces.map((place) => ({
  id: place.slug,
  label: place.title,
  note: place.note,
  top: place.top,
  left: place.left,
  emphasis: place.emphasis,
}));

export const exploreCards = explorePlaces.filter((place) => place.featured);

export const tripMarkers = [
  { label: "Windhoek", top: "16%", left: "64%" },
  { label: "En Route", top: "48%", left: "54%", emphasis: true },
  { label: "Swakopmund", top: "66%", left: "74%" },
];

export const tripTimeline = [
  {
    time: "08:00 AM",
    title: "Basecamp Departure",
    description: "Hotel pickup completed and route opened.",
    distance: "12 km",
    current: false,
  },
  {
    time: "11:30 AM",
    title: "Redwood Gorge Overlook",
    description:
      "Proceed to the northern ridge trail for optimal elevation tracking.",
    distance: "Current",
    current: true,
  },
  {
    time: "14:45 PM",
    title: "Coastal Outpost Beta",
    description: "Fuel stop and handoff into the afternoon drive.",
    distance: "24 km",
    current: false,
  },
];
