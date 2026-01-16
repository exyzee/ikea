import { redirect } from "next/navigation";
import { products } from "@/lib/data/helpers";

export default function BorrowPage() {
  const firstProduct = products[0]?.id ?? "guide";
  redirect(`/guide/${firstProduct}#neighbors`);
}
