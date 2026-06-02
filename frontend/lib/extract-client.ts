import { API_BASE } from "./config";
import type { ExtractResult, IntakeFiles } from "./types";

// Parse PDF text in the BROWSER (avoids Vercel's upload size limit + serverless
// PDF issues), then send small JSON text to /api/extract. Website is crawled server-side.

async function pdfToText(file: File): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n") : text).trim();
  } catch {
    return ""; // unreadable / scanned → server marks the source failed
  }
}

export async function extractFacts(intake: IntakeFiles): Promise<ExtractResult> {
  const [linkedin, resume] = await Promise.all([
    intake.linkedinFile ? pdfToText(intake.linkedinFile) : Promise.resolve(""),
    intake.resumeFile ? pdfToText(intake.resumeFile) : Promise.resolve(""),
  ]);

  const body = {
    linkedin,
    linkedinName: intake.linkedinFile ? intake.linkedinFile.name : undefined,
    resume,
    resumeName: intake.resumeFile ? intake.resumeFile.name : undefined,
    website: intake.websiteUrl.trim(),
    manualBio: intake.manualBio.trim(),
  };

  const res = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Extract route ${res.status}: ${detail.slice(0, 150)}`);
  }
  return (await res.json()) as ExtractResult;
}
