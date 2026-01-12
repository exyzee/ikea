export type Neighbor = {
  id: string;
  firstName: string;
  distanceKm: number;
  availabilityText: string;
  tools: string[];
  reliabilityText: string;
  avatarUrl: string;
};

export const neighbors: Neighbor[] = [
  {
    id: "jonas",
    firstName: "Jonas",
    distanceKm: 0.4,
    availabilityText: "Usually home after 18:00",
    tools: ["Phillips screwdriver", "Allen key (5mm)", "Level"],
    reliabilityText: "Replies within 10 minutes",
    avatarUrl: "/images/avatars/jonas.jpg"
  },
  {
    id: "sara",
    firstName: "Sara",
    distanceKm: 0.2,
    availabilityText: "Home on weekends",
    tools: ["Hammer", "Stud finder", "Power drill"],
    reliabilityText: "Reliable lender",
    avatarUrl: "/images/avatars/sara.jpg"
  },
  {
    id: "maja",
    firstName: "Maja",
    distanceKm: 0.6,
    availabilityText: "Available most mornings",
    tools: ["Phillips screwdriver", "Power drill with 3mm bit", "Tape measure"],
    reliabilityText: "Keeps tools clean",
    avatarUrl: "/images/avatars/maja.jpg"
  },
  {
    id: "leo",
    firstName: "Leo",
    distanceKm: 0.9,
    availabilityText: "Evenings only",
    tools: ["Allen key (4mm)", "Furniture strap kit", "Level"],
    reliabilityText: "Happy to help with tips",
    avatarUrl: "/images/avatars/leo.jpg"
  },
  {
    id: "anja",
    firstName: "Anja",
    distanceKm: 1.1,
    availabilityText: "Weeknights + Saturday",
    tools: ["Power drill", "Stud finder", "Hammer"],
    reliabilityText: "Prefers pickup at lobby",
    avatarUrl: "/images/avatars/anja.jpg"
  },
  {
    id: "oskar",
    firstName: "Oskar",
    distanceKm: 0.5,
    availabilityText: "Flexible hours",
    tools: ["Allen key (5mm)", "Small wrench", "Rubber mallet"],
    reliabilityText: "Experienced with IKEA builds",
    avatarUrl: "/images/avatars/oskar.jpg"
  },
  {
    id: "karin",
    firstName: "Karin",
    distanceKm: 0.3,
    availabilityText: "Works from home",
    tools: ["Phillips screwdriver", "Level", "Tape measure"],
    reliabilityText: "Responds quickly",
    avatarUrl: "/images/avatars/karin.jpg"
  },
  {
    id: "felix",
    firstName: "Felix",
    distanceKm: 1.4,
    availabilityText: "Traveling often, check first",
    tools: ["Power drill", "Allen key (5mm)", "Hammer"],
    reliabilityText: "Confirm timing",
    avatarUrl: "/images/avatars/felix.jpg"
  },
  {
    id: "elsa",
    firstName: "Elsa",
    distanceKm: 0.8,
    availabilityText: "Home mid-day",
    tools: ["Phillips screwdriver", "Power drill with 3mm bit", "Stud finder"],
    reliabilityText: "Shares status updates",
    avatarUrl: "/images/avatars/elsa.jpg"
  },
  {
    id: "noah",
    firstName: "Noah",
    distanceKm: 0.7,
    availabilityText: "After 17:00",
    tools: ["Hammer", "Allen key (4mm)", "Furniture strap kit", "Tape measure"],
    reliabilityText: "Trustworthy lender",
    avatarUrl: "/images/avatars/noah.jpg"
  }
];
