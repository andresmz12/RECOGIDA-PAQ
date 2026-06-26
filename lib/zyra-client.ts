const ZYRA_URL = process.env.ZYRA_URL || "";
const ZYRA_USERNAME = process.env.ZYRA_USERNAME || "";
const ZYRA_PASSWORD = process.env.ZYRA_PASSWORD || "";

let cachedToken: string | null = null;

export async function getZyraToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${ZYRA_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ZYRA_USERNAME, password: ZYRA_PASSWORD }),
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

export async function launchCall(
  phone: string,
  agentId: number
): Promise<{ call_id: string; retell_call_id: string; status: string }> {
  let token = await getZyraToken();

  const attempt = async (t: string) => {
    return fetch(`${ZYRA_URL}/calls/demo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ phone, agent_id: agentId }),
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
