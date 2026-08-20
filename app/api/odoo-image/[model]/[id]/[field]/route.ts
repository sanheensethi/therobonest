import { odooCall } from "@/lib/odoo";

/**
 * Authenticated image proxy for Odoo binary fields.
 *
 * WHY THIS EXISTS: Odoo's public /web/image/ route does NOT serve employee
 * photos. `hr.employee` has no publish field, so an unauthenticated request
 * gets a 6KB grey placeholder with HTTP 200 - which looks like a working
 * response and renders as a broken-image icon. (Measured: every employee
 * returned exactly 6078 bytes regardless of the real photo.)
 *
 * So the bytes are read over RPC with the API key, server-side, and streamed
 * out with a long cache lifetime. The key never leaves the server; the browser
 * only ever sees an image.
 *
 * STRICTLY WHITELISTED. An open proxy that could read any model and field
 * would leak the whole database through an image tag, so only the specific
 * model/field pairs the site actually renders are permitted.
 */
const ALLOWED: Record<string, string[]> = {
  "hr.employee": ["image_512", "image_256", "image_1024"],
  "res.partner": ["image_512", "image_256", "image_1024"],
};

// 1x1 transparent GIF, returned instead of an error so a missing image degrades
// to nothing visible rather than a broken-image icon.
const BLANK = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const blankResponse = () =>
  new Response(new Uint8Array(BLANK), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "public, max-age=60",
    },
  });

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ model: string; id: string; field: string }> }
) {
  const { model, id, field } = await ctx.params;

  if (!ALLOWED[model]?.includes(field)) return blankResponse();

  const recordId = Number(id);
  if (!Number.isInteger(recordId) || recordId <= 0) return blankResponse();

  try {
    const rows = await odooCall<Array<Record<string, string | false>>>(
      model,
      "read",
      [[recordId], [field]]
    );
    const b64 = rows?.[0]?.[field];
    if (!b64 || typeof b64 !== "string") return blankResponse();

    const bytes = Buffer.from(b64, "base64");

    // Odoo's own generated placeholder is tiny; serving it would just be the
    // grey silhouette again, so treat it as "no photo".
    if (bytes.length < 2048) return blankResponse();

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        // Odoo resizes on write, so the bytes for a given field are stable.
        "Content-Type": sniffMime(bytes),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return blankResponse();
  }
}

/** Minimal magic-number sniff; Odoo stores JPEG or PNG here. */
function sniffMime(b: Buffer): string {
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50) return "image/png";
  if (b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return "application/octet-stream";
}
