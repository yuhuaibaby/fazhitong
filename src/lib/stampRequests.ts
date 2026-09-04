export type StampRequest = {
  id: string;
  documentName: string;
  firmId: string;
  firmName: string;
  status: "pending" | "approved";
  createdAt: string;
  returnedAt?: string;
};

const KEY = "fazhi-stamp-request";

export function getStampRequest() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as StampRequest : null;
}

export function createStampRequest(request: Omit<StampRequest, "id" | "status" | "createdAt">) {
  const saved: StampRequest = { ...request, id: `STAMP-${Date.now()}`, status: "pending", createdAt: new Date().toLocaleString("zh-CN") };
  window.localStorage.setItem(KEY, JSON.stringify(saved));
  return saved;
}

export function approveStampRequest() {
  const request = getStampRequest();
  if (!request) return null;
  const approved = { ...request, status: "approved" as const, returnedAt: new Date().toLocaleString("zh-CN") };
  window.localStorage.setItem(KEY, JSON.stringify(approved));
  return approved;
}
