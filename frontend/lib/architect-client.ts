import { API_BASE } from "./config";
import type { ArchitectPlan, GenerateInput } from "./types";

export async function getArchitectPlan(input: GenerateInput): Promise<ArchitectPlan> {
  const res = await fetch(`${API_BASE}/api/architect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Architect route ${res.status}`);
  return (await res.json()) as ArchitectPlan;
}
