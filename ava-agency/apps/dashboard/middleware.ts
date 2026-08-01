import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Sicherheits-Schicht für das gesamte Dashboard (Seiten + API-Routen):
//  1) Anmeldung per HTTP-Basic-Auth – FAIL-CLOSED: ohne gesetztes
//     DASHBOARD_PASSWORD ist alles gesperrt (verhindert offene Massen-Mail-Freigabe).
//  2) CSRF-Schutz: zustandsändernde Anfragen (POST/PUT/DELETE) nur von der eigenen Seite.
const PW = process.env.DASHBOARD_PASSWORD;
const USER = process.env.DASHBOARD_USER || "ava";

function verlangeLogin(): NextResponse {
  return new NextResponse("Authentifizierung erforderlich.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AVA Agency"' },
  });
}

export function middleware(req: NextRequest): NextResponse {
  // CSRF: fremde Herkunft bei schreibenden Anfragen abweisen.
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") {
      return new NextResponse("Cross-Site-Anfrage blockiert.", { status: 403 });
    }
  }
  // Anmeldung erzwingen (fail-closed).
  const header = req.headers.get("authorization") || "";
  if (PW && header.startsWith("Basic ")) {
    try {
      const idx = atob(header.slice(6)).indexOf(":");
      const decoded = atob(header.slice(6));
      const user = idx >= 0 ? decoded.slice(0, idx) : "";
      const pass = idx >= 0 ? decoded.slice(idx + 1) : "";
      if (user === USER && pass === PW) return NextResponse.next();
    } catch {
      /* ungültiger Header → unten Login verlangen */
    }
  }
  return verlangeLogin();
}

// Auf alles außer den statischen Next-Assets anwenden.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
