"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { Select } from "@/components/Select";
import { ToolChip } from "@/components/ToolChip";
import { WarningCallout } from "@/components/WarningCallout";
import { neighbors, products } from "@/lib/data/helpers";
import { storeRequest } from "@/lib/storage/requests";

type ReturnOption = "same-day" | "tomorrow" | "date";

export const dynamic = "force-dynamic";

function parseToolsParam(value: string | null) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function RequestPage({ params }: { params: { neighborId: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const neighbor = neighbors.find((entry) => entry.id === params.neighborId);
  const toolsFromQuery = parseToolsParam(searchParams.get("tools"));
  const productFromQuery = searchParams.get("product") ?? products[0]?.id ?? "";

  const [productId, setProductId] = useState(productFromQuery);
  const [returnOption, setReturnOption] = useState<ReturnOption>("same-day");
  const [returnDate, setReturnDate] = useState("");
  const [note, setNote] = useState("");
  const [pickupWindow, setPickupWindow] = useState("");

  const product = useMemo(() => products.find((item) => item.id === productId), [productId]);
  const toolsRequested = toolsFromQuery.length ? toolsFromQuery : product?.requiredTools ?? [];

  if (!neighbor) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Neighbor not found</h1>
        <p className="text-gray-700">Choose another neighbor from the Borrow list.</p>
        <Button variant="secondary" href="/borrow">
          Back to Borrow
        </Button>
      </div>
    );
  }

  const sendRequest = () => {
    const params = new URLSearchParams();
    if (product?.id) params.set("product", product.id);
    if (toolsRequested.length) params.set("tools", toolsRequested.join(","));
    storeRequest({
      id: `${Date.now()}`,
      neighborId: neighbor.id,
      neighborName: neighbor.firstName,
      neighborAvatar: neighbor.avatarUrl,
      tools: toolsRequested,
      productId: product?.id,
      windowText: pickupWindow
        ? `${pickupWindow} • ${
            returnOption === "date" ? returnDate || "Pick date" : returnOption === "tomorrow" ? "Tomorrow" : "Same day"
          }`
        : undefined,
      note: note.trim() ? note.trim() : undefined,
      createdAt: new Date().toISOString()
    });
    router.push(`/sent?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center fade-in-up">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-600">Request</p>
          <h1 className="text-4xl font-semibold text-gray-900">Request tools from {neighbor.firstName}</h1>
          <p className="text-sm text-gray-700 max-w-2xl">
            Keep it short and precise: tools, pickup window, and return time. No chat threads, just the essentials.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[6px] border border-line bg-white">
          <img
            src="/images/request-hero.jpg"
            alt="Organized tools on a table"
            className="h-44 w-full object-cover sm:h-56"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />
        </div>
      </div>

      <Section title="Your details" description="Confirm which build this request supports.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Product"
            options={products.map((productOption) => ({ label: productOption.name, value: productOption.id }))}
            value={product?.id}
            onChangeValue={(value) => setProductId(value)}
          />
          <div className="text-sm text-gray-800">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-600">Neighbor</div>
            <div className="flex items-center gap-3">
              <img
                src={neighbor.avatarUrl}
                alt={`${neighbor.firstName} profile`}
                className="h-12 w-12 rounded-[4px] object-cover"
              />
              <div>
                <div className="text-sm font-semibold text-gray-900">{neighbor.firstName}</div>
                <div className="text-sm text-gray-700">
                  {neighbor.distanceKm.toFixed(1)} km • {neighbor.availabilityText}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">{neighbor.reliabilityText}</div>
          </div>
        </div>

        {toolsRequested.length ? (
          <div className="mt-6 space-y-2">
            <div className="text-sm font-semibold text-gray-900">Tools requested</div>
            <div className="flex flex-wrap gap-2">
              {toolsRequested.map((tool) => (
                <ToolChip key={tool} label={tool} />
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      <Section
        title="Message"
        description="Keep it concise: list the tools, pickup time, and return time."
        actions={
          <Button variant="secondary" type="button" onClick={sendRequest}>
            Send request
          </Button>
        }
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-gray-800">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Pickup window</span>
            <input
              type="text"
              placeholder="Today 18:00-20:00"
              value={pickupWindow}
              onChange={(event) => setPickupWindow(event.target.value)}
              className="w-full rounded-[2px] border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <Select
              label="Return time"
              options={[
                { label: "Same day", value: "same-day" },
                { label: "Tomorrow", value: "tomorrow" },
                { label: "Pick a date", value: "date" }
              ]}
              value={returnOption}
              onChangeValue={(value) => setReturnOption(value as ReturnOption)}
            />
            {returnOption === "date" ? (
              <label className="flex flex-col gap-2 text-sm text-gray-800">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Return date</span>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="w-full rounded-[2px] border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none"
                />
              </label>
            ) : null}
          </div>
          <label className="flex flex-col gap-2 text-sm text-gray-800">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Note</span>
            <textarea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder=""
              className="w-full rounded-[2px] border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none"
            />
          </label>
        </div>
      </Section>

      <WarningCallout title="Care">
        Return tools clean and on time. If a tool looks worn or unsafe, pause the build and ask for a different one.
        Keep communication short and focused on the task.
      </WarningCallout>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" type="button" onClick={sendRequest}>
          Send request
        </Button>
        <Button variant="secondary" href="/borrow">
          Back to Borrow
        </Button>
      </div>
    </div>
  );
}
