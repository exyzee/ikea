import { neighbors } from "./neighbors";
import { products } from "./products";
import type { Neighbor } from "./neighbors";
import type { Product } from "./products";

export function getProductById(productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function getNeighborsByTools(tools: string[]): Neighbor[] {
  const normalized = new Set(tools.map((tool) => tool.toLowerCase()));
  return neighbors.filter((neighbor) =>
    neighbor.tools.some((tool) => normalized.has(tool.toLowerCase()))
  );
}

export { neighbors, products };
