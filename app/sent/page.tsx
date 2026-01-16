"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { ToolChip } from "@/components/ToolChip";
import { getStoredRequests, type SentRequest } from "@/lib/storage/requests";

export const dynamic = "force-dynamic";

function parseToolsParam(value: string | null) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function SentPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-700">Loading…</div>}>
      <SentContent />
    </Suspense>
  );
}

function SentContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product") ?? "";
  const tools = parseToolsParam(searchParams.get("tools"));
  const [storedRequests, setStoredRequests] = useState<SentRequest[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [threadMessages, setThreadMessages] = useState<Record<string, string[]>>({});

  const seededConversations = [
    {
      id: "seed-jonas",
      neighborId: "jonas",
      neighborName: "Jonas",
      neighborAvatar: "/images/avatars/jonas.jpg",
      tools: ["Phillips screwdriver", "Level"],
      windowText: "Today 18:30 • Return tomorrow morning",
      status: "Approved for pickup",
      note: "I can pick up at 18:30. Need the screwdriver + level."
    },
    {
      id: "seed-sara",
      neighborId: "sara",
      neighborName: "Sara",
      neighborAvatar: "/images/avatars/sara.jpg",
      tools: ["Hammer"],
      windowText: "Tomorrow 09:00 • Same day return",
      status: "Awaiting approval",
      note: "Is the hammer available tomorrow morning?"
    }
  ];

  const confirmationText = useMemo(() => {
    if (!tools.length) return "Request sent. Awaiting confirmation.";
    return `Request sent for: ${tools.join(", ")}. Awaiting confirmation.`;
  }, [tools]);

  useEffect(() => {
    setStoredRequests(getStoredRequests());
  }, []);

  const conversations = storedRequests.length ? storedRequests : seededConversations;
  const activeRequest =
    conversations.find((request) => request.id === activeRequestId) ?? conversations[0];

  useEffect(() => {
    if (activeRequest && !activeRequestId) {
      setActiveRequestId(activeRequest.id);
    }
  }, [activeRequest, activeRequestId]);

  const currentThread = activeRequest ? threadMessages[activeRequest.id] ?? [] : [];

  const sendThreadMessage = () => {
    if (!activeRequest || !messageInput.trim()) return;
    setThreadMessages((prev) => ({
      ...prev,
      [activeRequest.id]: [...(prev[activeRequest.id] ?? []), messageInput.trim()]
    }));
    setMessageInput("");
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3 fade-in-up">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-gray-600">Requests</p>
        <h1 className="text-4xl font-semibold text-gray-900">Requests sent</h1>
        <p className="text-sm text-gray-700 max-w-2xl">
          {confirmationText.replace("Request sent", "Requests sent")}
        </p>
      </div>

      <Section
        title="Details"
        description="Keep your plan simple: pick up, complete the build, return on time."
        actions={
          <Button variant="secondary" href="/borrow">
            Back to Borrow
          </Button>
        }
      >
        <div className="space-y-4 text-sm text-gray-800">
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-600">Tools</div>
            {tools.length ? (
              <div className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <ToolChip key={tool} label={tool} />
                ))}
              </div>
            ) : (
              <p className="text-gray-700">No tools were specified.</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Inbox" description="Conversations with neighbors. Select a thread to view details.">
        {conversations.length ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="divide-y divide-gray-200">
              {conversations.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  onClick={() => setActiveRequestId(request.id)}
                  className={`w-full text-left flex flex-col gap-3 py-4 px-2 rounded-[4px] transition-colors ${
                    activeRequestId === request.id ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={request.neighborAvatar}
                      alt={`${request.neighborName} profile`}
                      className="h-12 w-12 rounded-[4px] object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{request.neighborName}</div>
                      {request.windowText ? (
                        <div className="text-xs text-gray-600">{request.windowText}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.tools.map((tool) => (
                      <ToolChip key={`${request.id}-${tool}`} label={tool} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="rounded-[6px] border border-line bg-white p-4">
              {activeRequest ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-line pb-3">
                    <img
                      src={activeRequest.neighborAvatar}
                      alt={`${activeRequest.neighborName} profile`}
                      className="h-12 w-12 rounded-[4px] object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{activeRequest.neighborName}</div>
                      <div className="text-xs text-gray-600">Conversation</div>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-[6px] border border-line bg-gray-50 px-4 py-3 text-xs uppercase tracking-[0.18em] text-gray-600">
                    <div className="flex flex-wrap items-center gap-3 text-gray-800">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Status</span>
                      <span className="rounded-[2px] border border-black px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-black">
                        {("status" in activeRequest && activeRequest.status) ? activeRequest.status : "Pending response"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-gray-800">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Pickup</span>
                      <span className="text-[11px]">{activeRequest.windowText ?? "Not set"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-gray-800">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Tools</span>
                      <div className="flex flex-wrap gap-2">
                        {activeRequest.tools.map((tool) => (
                          <ToolChip key={`${activeRequest.id}-detail-${tool}`} label={tool} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="self-start rounded-[6px] border border-line bg-gray-50 px-4 py-3">
                      Request received. I can meet you in the lobby this evening.
                    </div>
                    {activeRequest.note ? (
                      <div className="self-end rounded-[6px] border border-black bg-white px-4 py-3">
                        {activeRequest.note}
                      </div>
                    ) : null}
                    {currentThread.map((message, idx) => (
                      <div key={`${activeRequest.id}-msg-${idx}`} className="self-end rounded-[6px] border border-black bg-white px-4 py-3">
                        {message}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-gray-600">Message</label>
                    <textarea
                      rows={3}
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      className="w-full rounded-[2px] border border-line bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0058a3] focus:outline-none"
                      placeholder="Add a quick update..."
                    />
                    <Button variant="primary" type="button" onClick={sendThreadMessage}>
                      Send message
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700">Select a request to view its conversation.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">No saved requests yet.</p>
        )}
      </Section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href={productId ? `/guide/${productId}` : "/borrow"} variant="primary">
          Back to guide
        </Button>
        <Button
          href={`/borrow${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          variant="secondary"
        >
          Borrow again
        </Button>
      </div>
    </div>
  );
}
