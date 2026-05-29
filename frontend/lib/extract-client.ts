import { API_BASE } from "./config";
import type { ExtractResult, IntakeFiles } from "./types";

// Client entry point for real source extraction. Sends the uploaded PDFs +
// website URL + bio to /api/extract as multipart form data.

export async function extractFacts(intake: IntakeFiles): Promise<ExtractResult> {
  const fd = new FormData();
  if (intake.linkedinFile) fd.append("linkedin", intake.linkedinFile);
  if (intake.resumeFile) fd.append("resume", intake.resumeFile);
  if (intake.websiteUrl.trim()) fd.append("website", intake.websiteUrl.trim());
  if (intake.manualBio.trim()) fd.append("manualBio", intake.manualBio.trim());

  const res = await fetch(`${API_BASE}/api/extract`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Extract route responded ${res.status}`);
  return (await res.json()) as ExtractResult;
}
