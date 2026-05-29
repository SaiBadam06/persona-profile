import { API_BASE } from "./config";
import type { GeneratedProfile } from "./types";

/** Ask the AI to rewrite/edit the current profile per an instruction. */
export async function editProfile(
  profile: GeneratedProfile,
  instruction: string
): Promise<GeneratedProfile> {
  const res = await fetch(`${API_BASE}/api/edit-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, instruction }),
  });
  if (!res.ok) throw new Error(`Edit route responded ${res.status}`);
  const data = (await res.json()) as { profile: GeneratedProfile };
  return data.profile;
}
