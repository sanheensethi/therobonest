/**
 * Odoo JSON-RPC client. SERVER-SIDE ONLY.
 *
 * Never import this into a client component. It reads ODOO_API_KEY, and an
 * Odoo API key inherits its user's full permissions - leaking it into a
 * browser bundle would expose the CRM, invoicing and inventory.
 * Note the env vars deliberately have NO `NEXT_PUBLIC_` prefix, which is what
 * keeps Next from ever inlining them into client JS.
 *
 * Verified against this instance:
 *   server_version  saas~19.2+e   (Odoo Online, Enterprise)
 *   database        robonest-private-limited
 *   endpoint        POST /jsonrpc  -> reachable, returns version
 */

const URL_BASE = process.env.ODOO_URL ?? "https://www.therobonest.com";
const DB = process.env.ODOO_DB ?? "robonest-private-limited";
const LOGIN = process.env.ODOO_LOGIN ?? "";
const API_KEY = process.env.ODOO_API_KEY ?? "";

type RpcParams = {
  service: "common" | "object";
  method: string;
  args: unknown[];
};

class OdooError extends Error {}

async function rpc<T>(params: RpcParams): Promise<T> {
  const res = await fetch(`${URL_BASE}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
    // Works in both modes: at build time under output:'export', and as an
    // ISR revalidation window once we move to a server runtime.
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new OdooError(`Odoo HTTP ${res.status}`);

  const json = (await res.json()) as {
    result?: T;
    error?: { message?: string; data?: { message?: string } };
  };

  if (json.error) {
    // Surface Odoo's own message but never echo credentials.
    throw new OdooError(
      json.error.data?.message ?? json.error.message ?? "Odoo RPC error"
    );
  }
  return json.result as T;
}

let cachedUid: number | null = null;

/** Authenticate once per server instance and reuse the uid. */
export async function odooUid(): Promise<number> {
  if (cachedUid) return cachedUid;
  if (!LOGIN || !API_KEY) {
    throw new OdooError(
      "Odoo credentials missing. Set ODOO_LOGIN and ODOO_API_KEY."
    );
  }
  const uid = await rpc<number | false>({
    service: "common",
    method: "authenticate",
    args: [DB, LOGIN, API_KEY, {}],
  });
  if (!uid) {
    throw new OdooError(
      "Odoo rejected the credentials (check the login email and API key)."
    );
  }
  cachedUid = uid;
  return uid;
}

/** Low-level model call: odoo.execute_kw(model, method, args, kwargs). */
export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await odooUid();
  return rpc<T>({
    service: "object",
    method: "execute_kw",
    args: [DB, uid, API_KEY, model, method, args, kwargs],
  });
}

/** search_read with sensible defaults. */
export async function odooSearchRead<T>(
  model: string,
  domain: unknown[] = [],
  fields: string[] = [],
  opts: {
    limit?: number;
    offset?: number;
    order?: string;
    /** e.g. { bin_size: true } to get a size string instead of a binary blob. */
    context?: Record<string, unknown>;
  } = {}
): Promise<T[]> {
  return odooCall<T[]>(model, "search_read", [domain, fields], {
    limit: opts.limit ?? 50,
    offset: opts.offset ?? 0,
    ...(opts.order ? { order: opts.order } : {}),
    ...(opts.context ? { context: opts.context } : {}),
  });
}

/** Field schema for a model - used to map real field names, not guessed ones. */
export async function odooFields(
  model: string
): Promise<Record<string, { type: string; string: string }>> {
  return odooCall(model, "fields_get", [], {
    attributes: ["type", "string"],
  });
}

/** Reachability + version check. Needs no credentials. */
export async function odooVersion(): Promise<{ server_version: string }> {
  return rpc({ service: "common", method: "version", args: [] });
}

/** True if this deployment has Odoo wired up at all. */
export function odooConfigured(): boolean {
  return Boolean(LOGIN && API_KEY);
}

export { OdooError };
