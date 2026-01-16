"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { Select } from "@/components/Select";
import { Toggle } from "@/components/Toggle";
import { ToolChip } from "@/components/ToolChip";
import { WarningCallout } from "@/components/WarningCallout";
import { getNeighborsByTools, getProductById, neighbors, products } from "@/lib/data/helpers";
import { useRouter } from "next/navigation";

const wallOptions = [
  { label: "Drywall", value: "drywall" },
  { label: "Brick", value: "brick" },
  { label: "Concrete", value: "concrete" },
  { label: "Not sure", value: "not-sure" }
];

export default function GuidePage({ params }: { params: { productId: string } }) {
  const router = useRouter();
  const product = getProductById(params.productId);
  const [expandedOptional, setExpandedOptional] = useState(false);
  const [toolsUserHas, setToolsUserHas] = useState<Record<string, boolean>>({});
  const [whyOpen, setWhyOpen] = useState<Record<string, boolean>>({});
  const [mounting, setMounting] = useState(false);
  const [wallType, setWallType] = useState("drywall");
  const [guidance, setGuidance] = useState("This panel updates as you adjust tools and wall type.");
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [toolExplanations, setToolExplanations] = useState<Record<string, string>>({});
  const [toolLoading, setToolLoading] = useState<Record<string, boolean>>({});
  const [includeOptional, setIncludeOptional] = useState(false);
  const [availableToday, setAvailableToday] = useState(false);
  const [sort, setSort] = useState<"closest" | "reliable">("closest");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; neighbors?: typeof neighbors }>
  >([]);

  const allTools = useMemo(
    () => [...(product?.requiredTools ?? []), ...(product?.optionalTools ?? [])],
    [product]
  );

  const consideredTools = useMemo(() => {
    if (!product) return [];
    return includeOptional ? [...product.requiredTools, ...product.optionalTools] : product.requiredTools;
  }, [includeOptional, product]);

  const missingTools = useMemo(
    () => consideredTools.filter((tool) => !toolsUserHas[tool]),
    [consideredTools, toolsUserHas]
  );

  const missingNeighbors = useMemo(() => {
    if (!missingTools.length) return [];
    const base = getNeighborsByTools(missingTools);
    const availableFiltered = availableToday
      ? base.filter((neighbor) => /today|home|available|flexible/i.test(neighbor.availabilityText))
      : base;
    const sorted = [...availableFiltered].sort((a, b) => {
      if (sort === "closest") return a.distanceKm - b.distanceKm;
      return a.reliabilityText.localeCompare(b.reliabilityText);
    });
    return sorted;
  }, [availableToday, missingTools, sort]);

  const allNeighborTools = useMemo(() => neighbors.flatMap((neighbor) => neighbor.tools), []);

  useEffect(() => {
    const stored = window.localStorage.getItem("guide-chat-history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setChatMessages(parsed);
          return;
        }
      } catch {
        // ignore invalid cache
      }
    }
    setChatMessages([
      {
        role: "assistant",
        content:
          "Ask about your manual, missing tools, or who has a specific tool nearby. I’ll answer from the IKEA guide."
      }
    ]);
  }, []);

  useEffect(() => {
    if (!chatMessages.length) return;
    window.localStorage.setItem("guide-chat-history", JSON.stringify(chatMessages));
  }, [chatMessages]);

  if (!product) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Guide not found</h1>
        <p className="text-gray-700">
          The guide you are looking for is not available. Choose another product from your email link or
          return to borrowing.
        </p>
        <Button variant="secondary" href="/borrow">
          Go to Borrow
        </Button>
      </div>
    );
  }

  const borrowHref = missingTools.length > 0 ? "#neighbors" : undefined;

  const toggleTool = (tool: string) => {
    setToolsUserHas((prev) => ({ ...prev, [tool]: !prev[tool] }));
  };

  const handleWhy = async (tool: string) => {
    setWhyOpen((prev) => ({ ...prev, [tool]: !prev[tool] }));
    if (toolExplanations[tool] || toolLoading[tool]) return;
    setToolLoading((prev) => ({ ...prev, [tool]: true }));
    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          question: `Why is ${tool} needed for ${product.name}?`,
          wallType,
          needsMounting: mounting,
          toolsUserHas: toolsUserHasList
        })
      });
      const data = await response.json();
      setToolExplanations((prev) => ({ ...prev, [tool]: data.answerMarkdown ?? "No guidance available." }));
    } catch {
      setToolExplanations((prev) => ({ ...prev, [tool]: "Guidance unavailable right now. Try again shortly." }));
    } finally {
      setToolLoading((prev) => ({ ...prev, [tool]: false }));
    }
  };

  const toolsUserHasList = useMemo(
    () => Object.entries(toolsUserHas).filter(([, has]) => has).map(([tool]) => tool),
    [toolsUserHas]
  );

  const refreshGuidance = async (question: string) => {
    if (!product) return;
    try {
      setLoadingGuidance(true);
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          question,
          wallType,
          needsMounting: mounting,
          toolsUserHas: toolsUserHasList
        })
      });
      if (!response.ok) {
        throw new Error("Failed to fetch guidance");
      }
      const data = await response.json();
      setGuidance(data.answerMarkdown ?? "Guidance unavailable.");
    } catch (error) {
      setGuidance("Guidance unavailable right now. Try again in a moment.");
    } finally {
      setLoadingGuidance(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    refreshGuidance("How should I proceed safely?");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    refreshGuidance(`Mounting guidance for ${wallType}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallType, mounting]);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);
    try {
      const neighborQuery = /nearby|nearest|closest|neighbors|neighbour|near me|who is near|who's near/i.test(
        question
      );
      const tokens = question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      const toolMatch = allNeighborTools.find((tool) => {
        const toolTokens = tool
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean);
        return toolTokens.some((token) => token.length > 2 && tokens.includes(token));
      });
      const whoHasQuery = /who has|who's got|anyone with|anyone have|can lend/i.test(question);

      if (neighborQuery || (toolMatch && whoHasQuery)) {
        const filtered = toolMatch
          ? neighbors.filter((neighbor) =>
              neighbor.tools.some((tool) => tool.toLowerCase() === toolMatch.toLowerCase())
            )
          : neighbors;
        const sorted = [...filtered].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: toolMatch
              ? `Closest neighbors with ${toolMatch}:`
              : "Closest neighbors:",
            neighbors: sorted
          }
        ]);
        return;
      }

      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          question,
          wallType,
          needsMounting: mounting,
          toolsUserHas: toolsUserHasList
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
      <div className="relative z-20 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end fade-in-up">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-600">Assembly guide</p>
          <h1 className="text-4xl font-semibold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-700 max-w-2xl">
            Calm, step-by-step guidance from the original manual. Mark what you already have and borrow the rest nearby.
          </p>
          <div className="max-w-xs">
            <Select
              label="Product"
              options={products.map((item) => ({ label: item.name, value: item.id }))}
              value={product.id}
              onChangeValue={(value) => router.push(`/guide/${value}`)}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {product.requiredTools.slice(0, 3).map((tool) => (
              <ToolChip key={tool} label={tool} />
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[6px] border border-line bg-white">
          <img
            src={product.imageUrl}
            alt={`${product.name} product`}
            className="h-48 w-full object-cover sm:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
          <div className="absolute bottom-4 left-4 text-xs uppercase tracking-[0.2em] text-gray-700">
            Manual-first guidance
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2 fade-in-up fade-in-delay">
          <Section
            title="Tools you’ll need"
            description="Select the tools you already have. We’ll surface neighbors for what’s missing."
            className="z-0"
          >
            <div className="space-y-3">
              {product.requiredTools.map((tool) => (
                <div
                  key={tool}
                  className="flex flex-col gap-2 rounded-[4px] border border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label htmlFor={tool} className="flex items-start gap-3 cursor-pointer">
                    <input
                      id={tool}
                      type="checkbox"
                      className="peer sr-only"
                      checked={!!toolsUserHas[tool]}
                      onChange={() => toggleTool(tool)}
                    />
                    <span className="mt-1 flex h-5 w-5 items-center justify-center border border-black bg-white transition-colors peer-checked:border-[#0058a3] peer-checked:bg-[#0058a3] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0058a3]">
                      <svg
                        viewBox="0 0 12 10"
                        className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        aria-hidden
                      >
                        <path d="M1 5L4.2 8.2 11 1.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </span>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">{tool}</div>
                      <div className="text-xs text-gray-600">Already owned</div>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleWhy(tool)}
                    className="text-xs font-medium text-[#0058a3] underline underline-offset-4"
                    aria-expanded={!!whyOpen[tool]}
                  >
                    Why?
                  </button>
                </div>
              ))}
              {product.optionalTools.length ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    className="text-sm font-semibold text-gray-900 underline underline-offset-4"
                    onClick={() => setExpandedOptional((prev) => !prev)}
                    aria-expanded={expandedOptional}
                  >
                    Optional tools
                  </button>
                  {expandedOptional ? (
                    <div className="space-y-3">
                      {product.optionalTools.map((tool) => (
                        <div
                          key={tool}
                          className="flex flex-col gap-2 rounded-[4px] border border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <label htmlFor={tool} className="flex items-start gap-3 cursor-pointer">
                            <input
                              id={tool}
                              type="checkbox"
                              className="peer sr-only"
                              checked={!!toolsUserHas[tool]}
                              onChange={() => toggleTool(tool)}
                            />
                            <span className="mt-1 flex h-5 w-5 items-center justify-center border border-black bg-white transition-colors peer-checked:border-[#0058a3] peer-checked:bg-[#0058a3] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0058a3]">
                              <svg
                                viewBox="0 0 12 10"
                                className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                aria-hidden
                              >
                                <path d="M1 5L4.2 8.2 11 1.5" stroke="currentColor" strokeWidth="2" fill="none" />
                              </svg>
                            </span>
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900">{tool}</div>
                              <div className="text-xs text-gray-600">Already owned (optional)</div>
                            </div>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleWhy(tool)}
                            className="text-xs font-medium text-[#0058a3] underline underline-offset-4"
                            aria-expanded={!!whyOpen[tool]}
                          >
                            Why?
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              {allTools.map((tool) =>
                whyOpen[tool] ? (
                  <div
                    key={`${tool}-why`}
                    className="rounded-[4px] border border-line bg-gray-50 px-3 py-3 text-sm text-gray-800"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Why {tool}</div>
                    {toolLoading[tool] ? (
                      <p className="mt-2 text-sm text-gray-700">Updating guidance…</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {String(toolExplanations[tool] ?? "No guidance available.")
                          .split("\n")
                          .filter((line) => line.trim().length > 0)
                          .map((line, idx) => (
                            <p key={`${tool}-line-${idx}`}>{line}</p>
                          ))}
                      </div>
                    )}
                  </div>
                ) : null
              )}
            </div>

            <div className="mt-6 border-t border-line pt-4" id="neighbors">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                Neighbors with missing tools
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Toggle
                  label="Include optional tools"
                  description="Show helpers like levels or stud finders."
                  checked={includeOptional}
                  onChange={setIncludeOptional}
                />
                <Toggle
                  label="Available today"
                  description="Prioritize neighbors likely free today."
                  checked={availableToday}
                  onChange={setAvailableToday}
                />
              </div>
              <div className="mt-4 max-w-xs">
                <Select
                  label="Sort"
                  options={[
                    { label: "Closest", value: "closest" },
                    { label: "Most reliable", value: "reliable" }
                  ]}
                  value={sort}
                  onChangeValue={(value) => setSort(value as "closest" | "reliable")}
                />
              </div>
              {missingTools.length ? (
                <div className="mt-3 space-y-3">
                  {missingNeighbors.map((neighbor) => {
                    const matching = neighbor.tools.filter((tool) => missingTools.includes(tool));
                    return (
                      <div key={neighbor.id} className="flex items-center justify-between gap-3 lift-hover rounded-[6px] px-2 py-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={neighbor.avatarUrl}
                            alt={`${neighbor.firstName} profile`}
                            className="h-10 w-10 rounded-[4px] object-cover"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{neighbor.firstName}</div>
                            <div className="text-xs text-gray-600">
                              {neighbor.distanceKm.toFixed(1)} km • {matching.join(", ")}
                            </div>
                          </div>
                        </div>
                        <Button href={`/request/${neighbor.id}`} variant="secondary">
                          Request
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-700">You already have every required tool.</p>
              )}
            </div>
          </Section>

          <Section
            title="Safety & mounting"
            description="Follow the matching steps from your manual. Keep adjustments calm and methodical."
          >
            {product.supportsWallMount ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-[4px] border border-line px-3 py-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-900">I’m mounting this to a wall</div>
                    <div className="text-xs text-gray-600">Required for tall storage to prevent tip-over.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-[2px] border-gray-300 text-[#0058a3] focus:ring-[#0058a3]"
                    checked={mounting}
                    onChange={() => setMounting((prev) => !prev)}
                  />
                </div>
                {mounting ? (
                  <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
                    <Select
                      label="Wall type"
                      options={wallOptions}
                      value={wallType}
                      onChangeValue={setWallType}
                      aria-label="Select wall type"
                    />
                    <div className="text-sm text-gray-700 leading-relaxed">
                      Match anchors to the wall type. Pre-drill slowly and stop if resistance changes.
                    </div>
                  </div>
                ) : null}
                {wallType === "not-sure" ? (
                  <WarningCallout title="Safety first">
                    Pause until you confirm the wall type. Using the wrong anchor can cause the frame to detach. If you’re
                    unsure, borrow the correct hardware or ask for help before proceeding.
                  </WarningCallout>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-gray-700">This product does not require wall mounting.</div>
            )}
          </Section>
        </div>

        <aside className="rounded-[6px] border border-line bg-white p-4 lg:sticky lg:top-6">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-gray-600">Guidance</div>
            {loadingGuidance ? <p className="text-sm text-gray-700">Updating guidance…</p> : null}
            <div className="space-y-2 text-sm text-gray-800 leading-relaxed">
              {(() => {
                const lines = guidance.split("\n");
                const blocks: Array<{ type: "p" | "ul"; content: string[] }> = [];
                let currentList: string[] = [];

                const pushList = () => {
                  if (currentList.length) {
                    blocks.push({ type: "ul", content: currentList });
                    currentList = [];
                  }
                };

                lines.forEach((raw) => {
                  const line = raw.trim();
                  if (!line) {
                    pushList();
                    return;
                  }
                  if (line.startsWith("- ")) {
                    currentList.push(line.replace("- ", ""));
                    return;
                  }
                  pushList();
                  blocks.push({ type: "p", content: [line] });
                });
                pushList();

                return blocks.map((block, idx) => {
                  if (block.type === "ul") {
                    return (
                      <ul key={`ul-${idx}`} className="list-disc pl-5 space-y-1">
                        {block.content.map((item, itemIdx) => (
                          <li
                            key={`li-${idx}-${itemIdx}`}
                            dangerouslySetInnerHTML={{
                              __html: item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                            }}
                          />
                        ))}
                      </ul>
                    );
                  }

                  const paragraph = block.content.join(" ");
                  return (
                    <p
                      key={`p-${idx}`}
                      dangerouslySetInnerHTML={{
                        __html: paragraph.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      }}
                    />
                  );
                });
              })()}
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-800">
            Missing tools: <span className="font-semibold text-gray-900">{missingTools.length}</span>
            <span className="ml-2 text-xs text-gray-500">Borrow only what you need.</span>
          </div>
          {borrowHref ? (
            <Button href={borrowHref} variant="primary" className="w-full sm:w-auto">
              View neighbors
            </Button>
          ) : (
            <Button variant="primary" disabled className="w-full sm:w-auto">
              You have every tool
            </Button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-3 rounded-[2px] border border-black bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
        aria-expanded={chatOpen}
      >
        {chatOpen ? "Close helper" : "Ask for help"}
      </button>

      <div
        className={`fixed right-6 bottom-40 z-50 w-[340px] max-w-[calc(100vw-3rem)] rounded-[6px] border border-line bg-white p-4 transition-all duration-200 ${
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
                    <a
                      key={`chat-neighbor-${neighbor.id}`}
                      href={`/request/${neighbor.id}`}
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
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {chatLoading ? <div className="text-xs text-gray-600">Updating guidance…</div> : null}
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex flex-col gap-2 text-xs text-gray-600">
            Ask a question
            <textarea
              rows={3}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              className="w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none"
              placeholder="Who has a hammer nearby?"
            />
          </label>
          <Button variant="primary" type="button" onClick={handleChatSend} className="w-full">
            Send question
          </Button>
        </div>
      </div>
    </div>
  );
}
