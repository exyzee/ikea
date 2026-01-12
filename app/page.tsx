import { redirect } from "next/navigation";
import { products } from "@/lib/data/helpers";

export default function Home() {
  const firstProduct = products[0]?.id ?? "guide";
  redirect(`/guide/${firstProduct}`);
}
