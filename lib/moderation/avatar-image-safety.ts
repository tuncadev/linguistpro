import { GoogleGenAI } from "@google/genai";

type AvatarImageSource =
  | {
      kind: "data_url";
      dataUrl: string;
    }
  | {
      kind: "remote_url";
      url: string;
    };

export type AvatarSafetyDecision = {
  allowed: boolean;
  sexualContentDetected: boolean;
  reason: string;
  confidence: number | null;
};

const AUTO_BLOCK_CONFIDENCE = 0.9;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const BLOCKED_HOST_PATTERNS = [
  "porn",
  "xxx",
  "adult",
  "onlyfans",
  "xvideos",
  "xnxx",
  "redtube",
  "youporn",
  "brazzers",
];
const BLOCKED_PATH_PATTERNS = [
  "porn",
  "nude",
  "nudity",
  "nsfw",
  "sex",
  "explicit",
  "erotic",
  "fetish",
];

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64Data = match[2].replace(/\s+/g, "");
  return { mimeType, base64Data };
}

function estimatedByteLength(base64: string): number {
  const sanitized = base64.replace(/=+$/, "");
  return Math.floor((sanitized.length * 3) / 4);
}

function looksLikeAdultUrl(urlRaw: string): boolean {
  try {
    const parsed = new URL(urlRaw);
    const host = parsed.hostname.toLowerCase();
    const fullPath = `${parsed.pathname}${parsed.search}`.toLowerCase();

    if (BLOCKED_HOST_PATTERNS.some((token) => host.includes(token))) {
      return true;
    }

    return BLOCKED_PATH_PATTERNS.some((token) => fullPath.includes(token));
  } catch {
    return true;
  }
}

async function fetchRemoteImageAsInlineData(
  url: string
): Promise<{ mimeType: string; base64Data: string } | null> {
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    return null;
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!mimeType.startsWith("image/")) {
    return null;
  }

  const contentLengthRaw = response.headers.get("content-length");
  if (contentLengthRaw) {
    const contentLength = Number(contentLengthRaw);
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      return null;
    }
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return null;
  }

  const base64Data = Buffer.from(bytes).toString("base64");
  return { mimeType, base64Data };
}

async function classifyWithGemini(
  inlineData: { mimeType: string; base64Data: string }
): Promise<AvatarSafetyDecision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      allowed: true,
      sexualContentDetected: false,
      reason: "Avatar moderation service unavailable. Allowed without automated block.",
      confidence: null,
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt =
    "Classify this avatar image for profile safety. " +
    "Return JSON only with keys: sexualContentDetected (boolean), confidence (number 0..1), reason (string). " +
    "Set sexualContentDetected=true ONLY when image contains explicit sexual content or clear nudity (pornographic/erotic intent). " +
    "Do NOT flag regular portraits, face shots, casual clothing, dresses, swimwear, fitness wear, or fully covered body photos.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            mimeType: inlineData.mimeType,
            data: inlineData.base64Data,
          },
        },
      ] as unknown as any,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = extractJsonObject(response.text);
    const parsed = JSON.parse(raw) as {
      sexualContentDetected?: unknown;
      confidence?: unknown;
      reason?: unknown;
    };

    const sexualContentDetected = Boolean(parsed.sexualContentDetected);
    const confidence =
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : null;
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim().length > 0
        ? parsed.reason.trim()
        : sexualContentDetected
        ? "Sexual content detected in avatar image."
        : "Image appears safe.";

    const shouldBlock = sexualContentDetected && (confidence === null ? false : confidence >= AUTO_BLOCK_CONFIDENCE);

    return {
      allowed: !shouldBlock,
      sexualContentDetected,
      reason: shouldBlock
        ? reason
        : "No high-confidence explicit sexual content detected.",
      confidence,
    };
  } catch {
    return {
      allowed: true,
      sexualContentDetected: false,
      reason: "Avatar moderation failed. Allowed without automated block.",
      confidence: null,
    };
  }
}

export async function evaluateAvatarImageSafety(
  source: AvatarImageSource
): Promise<AvatarSafetyDecision> {
  if (source.kind === "remote_url") {
    if (looksLikeAdultUrl(source.url)) {
      return {
        allowed: false,
        sexualContentDetected: true,
        reason: "Avatar URL is blocked by safety policy.",
        confidence: 1,
      };
    }

    const inlineData = await fetchRemoteImageAsInlineData(source.url);
    if (!inlineData) {
      return {
        allowed: false,
        sexualContentDetected: false,
        reason: "Unable to validate remote avatar image.",
        confidence: null,
      };
    }

    return classifyWithGemini(inlineData);
  }

  const parsed = parseDataUrl(source.dataUrl);
  if (!parsed) {
    return {
      allowed: false,
      sexualContentDetected: false,
      reason: "Invalid avatar upload format.",
      confidence: null,
    };
  }

  if (estimatedByteLength(parsed.base64Data) > MAX_IMAGE_BYTES) {
    return {
      allowed: false,
      sexualContentDetected: false,
      reason: "Avatar image is too large to validate.",
      confidence: null,
    };
  }

  return classifyWithGemini(parsed);
}
