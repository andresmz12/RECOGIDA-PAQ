const ZYRA_URL = process.env.ZYRA_URL || "";
const ZYRA_USERNAME = process.env.ZYRA_USERNAME || "";
const ZYRA_PASSWORD = process.env.ZYRA_PASSWORD || "";

let cachedToken: string | null = null;

export async function getZyraToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${ZYRA_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ZYRA_USERNAME, password: ZYRA_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`ZyraVoice auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token as string;
  return cachedToken;
}

export function invalidateZyraToken() {
  cachedToken = null;
}

export interface CallCustomContext {
  trackingCode: string;
  contactName: string;
  pickupAddress: string;
  recipientName: string;
  recipientAddress: string;
}

export async function launchCall(
  phone: string,
  agentId: number,
  customContext?: CallCustomContext
): Promise<{ call_id: string; retell_call_id: string; status: string }> {
  let token = await getZyraToken();

  const attempt = async (t: string) => {
    return fetch(`${ZYRA_URL}/calls/demo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({
        phone,
        agent_id: agentId,
        ...(customContext ? { custom_context: customContext } : {}),
      }),
    });
  };

  let res = await attempt(token);

  if (res.status === 401) {
    invalidateZyraToken();
    token = await getZyraToken();
    res = await attempt(token);
  }

  if (!res.ok) {
    throw new Error(`ZyraVoice launchCall failed: ${res.status}`);
  }

  return res.json();
}

export interface ZyraProspect {
  id: number;
  [key: string]: unknown;
}

export async function createProspect(
  phone: string,
  name: string,
  campaignId: number,
  customContext?: CallCustomContext
): Promise<ZyraProspect> {
  let token = await getZyraToken();

  const attempt = async (t: string) => {
    return fetch(`${ZYRA_URL}/prospects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({
        name,
        phone,
        campaign_id: campaignId,
        ...(customContext ? { custom_context: customContext } : {}),
      }),
    });
  };

  let res = await attempt(token);

  if (res.status === 401) {
    invalidateZyraToken();
    token = await getZyraToken();
    res = await attempt(token);
  }

  if (!res.ok) {
    throw new Error(`ZyraVoice createProspect failed: ${res.status}`);
  }

  return res.json();
}

export async function callProspect(
  prospectId: number
): Promise<{ call_id: string; retell_call_id: string; status: string }> {
  let token = await getZyraToken();

  const attempt = async (t: string) => {
    return fetch(`${ZYRA_URL}/prospects/${prospectId}/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
    });
  };

  let res = await attempt(token);

  if (res.status === 401) {
    invalidateZyraToken();
    token = await getZyraToken();
    res = await attempt(token);
  }

  if (!res.ok) {
    throw new Error(`ZyraVoice callProspect failed: ${res.status}`);
  }

  return res.json();
}

// Production flow: create the prospect record first, then trigger the real
// call against it (replaces the /calls/demo shortcut).
export async function createProspectAndCall(
  phone: string,
  name: string,
  campaignId: number,
  customContext?: CallCustomContext
): Promise<{ call_id: string; retell_call_id: string; status: string }> {
  const prospect = await createProspect(phone, name, campaignId, customContext);
  return callProspect(prospect.id);
}
