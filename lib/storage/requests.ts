export type SentRequest = {
  id: string;
  neighborId: string;
  neighborName: string;
  neighborAvatar: string;
  tools: string[];
  productId?: string;
  windowText?: string;
  note?: string;
  createdAt: string;
};

const STORAGE_KEY = "ikea-together-requests";

export function getStoredRequests(): SentRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function storeRequest(request: SentRequest) {
  if (typeof window === "undefined") return;
  const existing = getStoredRequests();
  const next = [request, ...existing].slice(0, 20);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
