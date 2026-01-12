"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { Select } from "@/components/Select";
import { Toggle } from "@/components/Toggle";
import { ToolChip } from "@/components/ToolChip";
import { getNeighborsByTools, neighbors, products } from "@/lib/data/helpers";

type SortOption = "closest" | "reliable";

export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  neighbors?: typeof neighbors;
};

function reliabilityScore(text: string) {
  const lowered = text.toLowerCase();
  if (lowered.includes("trust")) return 5;
  if (lowered.includes("reliable")) return 4;
  if (lowered.includes("responds") || lowered.includes("replies")) return 3;
  if (lowered.includes("experienced")) return 2;
  return 1;
}

export default function BorrowPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-700">Loading…</div>}>
      <BorrowContent />
    </Suspense>
  );
}

function parseToolsParam(value: string | null) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function BorrowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryProduct = searchParams.get("product");
  const queryTools = parseToolsParam(searchParams.get("tools"));

  const initialProduct = products.find((item) => item.id === queryProduct)?.id ?? products[0]?.id ?? "";
  const [selectedProductId, setSelectedProductId] = useState(initialProduct);
  const [includeOptional, setIncludeOptional] = useState(false);
  const [availableToday, setAvailableToday] = useState(false);
  const [sort, setSort] = useState<SortOption>("closest");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatProduct, setChatProduct] = useState("all");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask about any IKEA build, missing tools, or safety steps. I can summarize the manuals and point you to nearby neighbors."
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (queryProduct && queryProduct !== selectedProductId) {
      setSelectedProductId(queryProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryProduct]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? products[0],
    [selectedProductId]
  );

  const toolsNeeded = useMemo(() => {
    if (queryTools.length) return queryTools;
    if (!selectedProduct) return [] as string[];
    return includeOptional
      ? [...selectedProduct.requiredTools, ...selectedProduct.optionalTools]
      : selectedProduct.requiredTools;
  }, [includeOptional, queryTools, selectedProduct]);

  const filteredNeighbors = useMemo(() => {
    const base = toolsNeeded.length ? getNeighborsByTools(toolsNeeded) : neighbors;
    const availableFiltered = availableToday
      ? base.filter((neighbor) => /today|home|available|flexible/i.test(neighbor.availabilityText))
      : base;
    const sorted = [...availableFiltered].sort((a, b) => {
      if (sort === "closest") {
        return a.distanceKm - b.distanceKm;
      }
      return a.reliabilityText.localeCompare(b.reliabilityText);
    });
    return sorted;
  }, [availableToday, sort, toolsNeeded]);

  const nearestNeighbors = useMemo(() => {
    return [...neighbors].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
  }, []);

  const requestHrefFor = (neighborId: string) => {
    const params = new URLSearchParams();
    if (selectedProduct?.id) params.set("product", selectedProduct.id);
    if (toolsNeeded.length) params.set("tools", toolsNeeded.join(","));
    return `/request/${neighborId}?${params.toString()}`;
  };

  useEffect(() => {
    if (!chatOpen) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);
    try {
      const neighborQuery = /nearby|nearest|closest|neighbors|neighbour|near me|who is near|who's near/i.test(question);
      if (neighborQuery) {
        const questionTokens = question
          .toLowerCase()
          .replace(/[^a-z0-9\\s]/g, " ")
          .split(/\\s+/)
          .filter(Boolean);
        const toolMatch = neighbors
          .flatMap((neighbor) => neighbor.tools)
          .find((tool) => {
            const toolTokens = tool
              .toLowerCase()
              .replace(/[^a-z0-9\\s]/g, " ")
              .split(/\\s+/)
              .filter(Boolean);
            return toolTokens.some((token) => token.length > 2 && questionTokens.includes(token));
          });

        const filteredByTool = toolMatch
          ? neighbors.filter((neighbor) => neighbor.tools.some((tool) => tool.toLowerCase() === toolMatch.toLowerCase()))
          : neighbors;

        const wantsReliable = /reliable|trust|best|top/i.test(question);
        const sorted = [...filteredByTool].sort((a, b) => {
          if (wantsReliable) {
            return reliabilityScore(b.reliabilityText) - reliabilityScore(a.reliabilityText);
          }
          return a.distanceKm - b.distanceKm;
        });
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: toolMatch
              ? `Here are neighbors with ${toolMatch} nearby.`
              : wantsReliable
                ? "Here are the most reliable neighbors based on their lending history."
                : "Here are the closest neighbors based on distance.",
            neighbors: sorted.slice(0, 5)
          }
        ]);
        return;
      }

      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: chatProduct,
          question,
          wallType: "not-sure",
          needsMounting: false,
          toolsUserHas: []
        })
      });
      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answerMarkdown ?? "No guidance available." }
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Guidance is unavailable right now. Try again shortly." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center fade-in-up">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-600">Borrow tools</p>
          <h1 className="text-4xl font-semibold text-gray-900">Borrow what you need, right now</h1>
          <p className="text-sm text-gray-700 max-w-2xl">
            Choose a product and check nearby neighbors. Keep the process short, clear, and focused on finishing the
            build today.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[6px] border border-line bg-white">
          <img
            src="/images/borrow-hero.jpg"
            alt="Tools laid out on a clean workbench"
            className="h-44 w-full object-cover sm:h-56"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.7fr] lg:items-start">
        <div className="space-y-6 fade-in-up fade-in-delay">
          <Section title="Your build" description="Select the product you are assembling to find matching tools nearby.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Product"
                options={products.map((product) => ({ label: product.name, value: product.id }))}
                value={selectedProduct?.id}
                onChangeValue={(value) => {
                  setSelectedProductId(value);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("product", value);
                  router.push(`/borrow?${params.toString()}`);
                }}
              />
              <Toggle
                label="Include optional tools"
                description="Show neighbors who have alignment or mounting helpers."
                checked={includeOptional}
                onChange={setIncludeOptional}
              />
            </div>
            {toolsNeeded.length ? (
              <div className="mt-6 space-y-3">
                <div className="text-sm font-semibold text-gray-900">Tools in this search</div>
                <div className="flex flex-wrap gap-2">
                  {toolsNeeded.map((tool) => (
                    <ToolChip key={tool} label={tool} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-700">Add tools through the guide page to see matches.</p>
            )}
          </Section>

          <Section title="Filters" description="Keep the list short and practical so you can pick up quickly.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle
                label="Available today"
                description="Show neighbors likely free today."
                checked={availableToday}
                onChange={setAvailableToday}
              />
              <Select
                label="Sort by"
                options={[
                  { label: "Closest", value: "closest" },
                  { label: "Most reliable", value: "reliable" }
                ]}
                value={sort}
                onChangeValue={(value) => setSort(value as SortOption)}
              />
            </div>
          </Section>

          <Section
            title="Neighbors"
            description="Matches are sorted by distance or reliability. Tap a card to request."
            actions={
              <Button variant="secondary" href="/sent">
                View sent requests
              </Button>
            }
          >
            <div className="divide-y divide-gray-200">
              {filteredNeighbors.map((neighbor) => (
                <Link
                  key={neighbor.id}
                  href={requestHrefFor(neighbor.id)}
                  className="flex flex-col gap-3 py-4 outline-none transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0058a3] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={neighbor.avatarUrl}
                      alt={`${neighbor.firstName} profile`}
                      className="h-12 w-12 rounded-[4px] object-cover"
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">{neighbor.firstName}</div>
                    <div className="text-sm text-gray-700">
                      {neighbor.distanceKm.toFixed(1)} km • {neighbor.availabilityText}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-600">
                      {neighbor.tools.map((tool) => (
                        <span key={tool} className="rounded-[3px] border border-line bg-gray-50 px-2 py-1">
                          {tool}
                        </span>
                      ))}
                    </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600">{neighbor.reliabilityText}</span>
                    <span className="text-xs font-medium text-[#0058a3] underline underline-offset-4">Request</span>
                  </div>
                </Link>
              ))}
            </div>
            {filteredNeighbors.length === 0 ? (
              <p className="text-sm text-gray-700">No matches for those tools yet. Try excluding optional tools.</p>
            ) : null}
          </Section>
        </div>

        <aside className="space-y-4">
          <Section title="Nearest pickup" description="Fastest options based on distance.">
            <div className="space-y-3">
              {nearestNeighbors.map((neighbor) => (
                <div
                  key={neighbor.id}
                  className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={neighbor.avatarUrl}
                      alt={`${neighbor.firstName} profile`}
                      className="h-10 w-10 rounded-[4px] object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{neighbor.firstName}</div>
                      <div className="text-xs text-gray-600">{neighbor.distanceKm.toFixed(1)} km away</div>
                    </div>
                  </div>
                  <Button href={requestHrefFor(neighbor.id)} variant="secondary">
                    Request
                  </Button>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Borrowing tips" description="Short, practical reminders.">
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>Confirm pickup window before you travel.</li>
              <li>Ask only for the tool you need, not full kits.</li>
              <li>Return tools clean and on time.</li>
            </ul>
          </Section>
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-6 left-6 z-30 flex items-center gap-3 rounded-[2px] border border-black bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
        aria-expanded={chatOpen}
      >
        {chatOpen ? "Close helper" : "Ask for help"}
      </button>

      <div
        className={`fixed left-6 bottom-24 z-40 w-[340px] max-w-[calc(100vw-3rem)] rounded-[6px] border border-line bg-white p-4 transition-all duration-200 ${
          chatOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-600">Guide assistant</div>
            <div className="text-sm font-semibold text-gray-900">Manual-based answers</div>
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="rounded-[2px] border border-line px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-600 hover:bg-gray-50"
            aria-label="Close chat"
          >
            Close
          </button>
        </div>

        <div className="mt-3 space-y-2 text-xs text-gray-700">
          <Select
            label="Focus"
            options={[
              { label: "All purchases", value: "all" },
              ...products.map((product) => ({ label: product.name, value: product.id }))
            ]}
            value={chatProduct}
            onChangeValue={setChatProduct}
          />
        </div>

        <div className="mt-4 max-h-[240px] space-y-3 overflow-auto pr-1 text-sm text-gray-800">
          {chatMessages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`rounded-[4px] border px-3 py-2 ${
                message.role === "assistant" ? "border-line bg-gray-50" : "border-black bg-white"
              }`}
            >
              <p>{message.content}</p>
              {message.neighbors ? (
                <div className="mt-3 space-y-2">
                  {message.neighbors.map((neighbor) => (
                    <Link
                      key={`chat-${neighbor.id}`}
                      href={requestHrefFor(neighbor.id)}
                      className="flex items-center justify-between rounded-[4px] border border-line bg-white px-2 py-2 text-xs text-gray-800 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2">
                        <img
                          src={neighbor.avatarUrl}
                          alt={`${neighbor.firstName} profile`}
                          className="h-6 w-6 rounded-[3px] object-cover"
                        />
                        {neighbor.firstName}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        {neighbor.distanceKm.toFixed(1)} km
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {chatLoading ? <div className="text-xs text-gray-600">Updating guidance…</div> : null}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex flex-col gap-2 text-xs text-gray-600">
            Ask a question
            <textarea
              rows={3}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none"
              placeholder="Which tools do I need for wall mounting?"
            />
          </label>
          <Button variant="primary" type="button" onClick={handleSend} className="w-full">
            Send question
          </Button>
        </div>

      </div>
    </div>
  );
}
