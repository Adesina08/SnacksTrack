// /frontend/src/lib/manual.ts
export type ManualEntryPayload = {
  productName: string;
  brand?: string | null;
  category?: string | null;
  amountSpent?: number | string | null;
  currency?: string | null; // default NGN if omitted
  companions?: string | null;
  notes?: string | null;
};

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export async function saveManualEntry(payload: ManualEntryPayload) {
  const res = await fetch(`${baseUrl}/api/logConsumption`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Save failed");
  return data as { ok: true; id: number };
}
