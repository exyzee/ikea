export type Product = {
  id: string;
  name: string;
  requiredTools: string[];
  optionalTools: string[];
  supportsWallMount: boolean;
  imageUrl: string;
};

export const products: Product[] = [
  {
    id: "billy-bookcase",
    name: "BILLY Bookcase",
    requiredTools: ["Phillips screwdriver", "Hammer", "Allen key (5mm)"],
    optionalTools: ["Stud finder", "Level"],
    supportsWallMount: true,
    imageUrl: "/images/products/billy-bookcase.jpg"
  },
  {
    id: "malm-chest",
    name: "MALM 4-Drawer Chest",
    requiredTools: ["Phillips screwdriver", "Hammer", "Allen key (4mm)"],
    optionalTools: ["Power drill", "Furniture strap kit"],
    supportsWallMount: true,
    imageUrl: "/images/products/malm-chest.jpg"
  },
  {
    id: "lack-table",
    name: "LACK Coffee Table",
    requiredTools: ["Phillips screwdriver"],
    optionalTools: ["Power drill", "Furniture pads"],
    supportsWallMount: false,
    imageUrl: "/images/products/lack-table.jpg"
  },
  {
    id: "poang-chair",
    name: "POANG Chair",
    requiredTools: ["Allen key (5mm)", "Small wrench"],
    optionalTools: ["Rubber mallet"],
    supportsWallMount: false,
    imageUrl: "/images/products/poang-chair.jpg"
  },
  {
    id: "pax-wardrobe",
    name: "PAX Wardrobe Frame",
    requiredTools: ["Phillips screwdriver", "Hammer", "Allen key (5mm)", "Power drill with 3mm bit"],
    optionalTools: ["Level", "Stud finder", "Tape measure"],
    supportsWallMount: true,
    imageUrl: "/images/products/pax-wardrobe.jpg"
  }
];
