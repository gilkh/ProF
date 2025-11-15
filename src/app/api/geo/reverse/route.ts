import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'lat and lon are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
      headers: { 'User-Agent': 'ProF-App/1.0', 'Accept-Language': 'en' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'geocode_failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    const a = data?.address || {};
    const result = {
      state: a.state || a.state_district,
      district: a.county || a.state_district || a.municipality,
      city: a.city || a.town || a.village || a.suburb || a.neighbourhood,
    };
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'geocode_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}