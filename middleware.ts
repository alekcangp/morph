import { Context, HonoRequest, Next } from "hono";
import { validateFramesPost } from "@xmtp/frames-validator";

export const xmtpSupport = async (c: Context, next: Next) => {
  await next();

  const isFrame = c.res.headers.get("content-type")?.includes("html");
  if (!isFrame) return;

  if (!(await isXMTP(c.req))) return;

  let html = await c.res.text();

  const state = extractState(html);

  if (state) {
    const stateParams = toSearchParams(state);
    html = addStateToPostUrl(html, stateParams.toString());
    html = addStatesToButtonTargets(html, stateParams.toString());
  }

  const metaTag = '<meta property="of:accepts:xmtp" content="vNext" />';
  html = html.replace(/(<head>)/i, `$1${metaTag}`);

  c.res = new Response(html, {
    headers: {
      "content-type": "text/html",
    },
  });
};

export const validateXMTPUser = async (c: Context, next: Next) => {
  if (c.req.method !== "POST") {
    await next();
    return;
  }

  const requestBody = (await c.req.json().catch(() => {})) || {};

  if (requestBody?.clientProtocol?.includes("xmtp")) {
    c.set("client", "xmtp");
    const { verifiedWalletAddress } = await validateFramesPost(requestBody);
    c.set("verifiedWalletAddress", verifiedWalletAddress);
  } else {
    //add farcaster check
    c.set("client", "farcaster");
  }

  await next();
};

async function isXMTP(req: HonoRequest) {
  let requestBody = null;

  requestBody = (await req.json().catch(() => {})) || {};
  console.log(requestBody);
  return requestBody?.clientProtocol?.includes("xmtp") || false;
}

function addStatesToButtonTargets(html: string, query: string): string {
  const metaTagRegex =
    /<meta property="fc:frame:button:([1-9]):target" content="([^"]+)"/g;
  return html.replace(metaTagRegex, (match, buttonNum, url) => {
    const separator = url.includes("?") ? "&" : "?";
    const updatedUrl = `${url}${separator}${query}`;
    return `<meta property="fc:frame:button:${buttonNum}:target" content="${updatedUrl}"`;
  });
}

function addStateToPostUrl(html: string, query: string): string {
  const metaTagRegex = /<meta property="fc:frame:post_url" content="([^"]+)"/;
  const match = html.match(metaTagRegex);
  if (match && !match[1].includes("?")) {
    const updatedUrl = `${match[1]}?${query}`;
    html = html.replace(
      metaTagRegex,
      `<meta property="fc:frame:post_url" content="${updatedUrl}"`,
    );
  }
  return html;
}

function extractState(htmlString: string): object | null {
  const metaTagStart = htmlString.indexOf('<meta property="fc:frame:state"');
  if (metaTagStart === -1) return null;

  const contentStart = htmlString.indexOf('content="', metaTagStart);
  if (contentStart === -1) return null;

  const contentEnd = htmlString.indexOf('"', contentStart + 9);
  if (contentEnd === -1) return null;

  const state = htmlString.substring(contentStart + 9, contentEnd);

  return JSON.parse(decodeURIComponent(state));
}

export function toSearchParams(object: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(object)) {
    const encoded = (() => {
      if (typeof value === "string") return encodeURIComponent(value);
      if (typeof value === "number") return value.toString();
      if (typeof value === "boolean") return value.toString();
      if (typeof value === "object" && value !== null) {
        return encodeURIComponent(
          Array.isArray(value)
            ? `#A_${value.join(",")}`
            : `#O_${JSON.stringify(value)}`,
        );
      }
      return undefined;
    })();
    if (encoded) params.set(key, encoded);
  }
  return params;
}
