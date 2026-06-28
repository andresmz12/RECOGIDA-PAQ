import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const country = req.nextUrl.searchParams.get("country") ?? "";

  if (!q || q.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`;
    if (country) url += `&countrycodes=${country}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "OGloboCargo/1.0 (recogida-paq; contact@oglobocargo.com)",
        "Accept": "application/json",
        "Accept-Language": "en",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
