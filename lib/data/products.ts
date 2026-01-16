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
    imageUrl: "https://www.ikea.com/us/en/images/products/billy-bookcase-white__0625599_pe692385_s5.jpg"
  },
  {
    id: "malm-chest",
    name: "MALM 4-Drawer Chest",
    requiredTools: ["Phillips screwdriver", "Hammer", "Allen key (4mm)"],
    optionalTools: ["Power drill", "Furniture strap kit"],
    supportsWallMount: true,
    imageUrl:
      "https://www.ikea.com/images/natural-wood-dresser-with-a-lamp-and-plant-ontop-f5acdb03b9a4be501ab7f7d66187265a.jpg?f=sg"
  },
  {
    id: "lack-table",
    name: "LACK Coffee Table",
    requiredTools: ["Phillips screwdriver"],
    optionalTools: ["Power drill", "Furniture pads"],
    supportsWallMount: false,
    imageUrl: "https://www.ikea.com/us/en/images/products/lack-coffee-table-black-brown__57540_pe163122_s5.jpg"
  },
  {
    id: "poang-chair",
    name: "POANG Chair",
    requiredTools: ["Allen key (5mm)", "Small wrench"],
    optionalTools: ["Rubber mallet"],
    supportsWallMount: false,
    imageUrl:
      "https://www.ikea.com/us/en/images/products/gryteryd-recliner-rocker-armchair-hakebo-beige__1440612_pe985904_s5.jpg?f=s"
  },
  {
    id: "pax-wardrobe",
    name: "PAX Wardrobe Frame",
    requiredTools: ["Phillips screwdriver", "Hammer", "Allen key (5mm)", "Power drill with 3mm bit"],
    optionalTools: ["Level", "Stud finder", "Tape measure"],
    supportsWallMount: true,
    imageUrl:
      "https://www.ikea.com/images/organization-containers-in-a-shelving-unit-filled-with-folde-631569969c2a6a929a328f161e39b334.jpg?f=sg"
  }
];
