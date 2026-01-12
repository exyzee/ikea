"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { Select } from "@/components/Select";
import { ToolChip } from "@/components/ToolChip";
import { WarningCallout } from "@/components/WarningCallout";
import { getProductById, products } from "@/lib/data/helpers";
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

  const allTools = useMemo(
    () => [...(product?.requiredTools ?? []), ...(product?.optionalTools ?? [])],
    [product]
  );

  const missingTools = useMemo(
    () => allTools.filter((tool) => !toolsUserHas[tool]),
    [allTools, toolsUserHas]
  );

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

  const borrowHref =
    missingTools.length > 0
      ? `/borrow?product=${encodeURIComponent(product.id)}&tools=${encodeURIComponent(missingTools.join(","))}`
      : undefined;

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

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end fade-in-up">
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
            description="Confirm each tool before you start. Optional tools stay hidden until you expand them."
          >
            <div className="space-y-3">
              {product.requiredTools.map((tool) => (
                <div
                  key={tool}
                  className="flex flex-col gap-2 rounded-[4px] border border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={tool}
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded-[2px] border-gray-300 text-[#0058a3] focus:ring-[#0058a3]"
                      checked={!!toolsUserHas[tool]}
                      onChange={() => toggleTool(tool)}
                    />
                    <label htmlFor={tool} className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">{tool}</div>
                      <div className="text-xs text-gray-600">I have this</div>
                    </label>
                  </div>
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
                          <div className="flex items-start gap-3">
                            <input
                              id={tool}
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded-[2px] border-gray-300 text-[#0058a3] focus:ring-[#0058a3]"
                              checked={!!toolsUserHas[tool]}
                              onChange={() => toggleTool(tool)}
                            />
                            <label htmlFor={tool} className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900">{tool}</div>
                              <div className="text-xs text-gray-600">Nice-to-have</div>
                            </label>
                          </div>
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

        <aside className="rounded-[6px] border border-line bg-white p-4 panel-grid lg:sticky lg:top-6">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-gray-600">Guidance</div>
            {loadingGuidance ? <p className="text-sm text-gray-700">Updating guidance…</p> : null}
            <div className="space-y-2 text-sm text-gray-800 leading-relaxed">
              {guidance
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((line, idx) =>
                  line.startsWith("- ") ? (
                    <ul key={idx} className="list-disc pl-5">
                      <li>{line.replace("- ", "")}</li>
                    </ul>
                  ) : (
                    <p key={idx}>{line}</p>
                  )
                )}
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
              Find nearby tools
            </Button>
          ) : (
            <Button variant="primary" disabled className="w-full sm:w-auto">
              You have every tool
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
