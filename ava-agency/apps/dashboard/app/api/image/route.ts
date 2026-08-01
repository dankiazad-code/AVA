import { db } from '@ava/core';
import { eq, desc } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

const NAMES: Record<string, string> = {
  combined: 'combined', beforeDesktop: 'beforeDesktop', afterDesktop: 'afterDesktop',
  beforeMobile: 'beforeMobile', afterMobile: 'afterMobile',
};

// Liefert ein Artefakt-Bild eines Leads aus dem artifacts/-Ordner (pfad-sicher).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('lead') ?? '';
  const name = searchParams.get('name') ?? 'combined';
  if (!NAMES[name]) return new Response('bad name', { status: 400 });

  const opt = await db.db.query.optimizations.findFirst({
    where: eq(db.optimizations.leadId, leadId),
    orderBy: (o) => desc(o.createdAt),
  });
  const artifacts = (opt?.artifacts as Record<string, string> | null) ?? null;
  const filePath = artifacts?.[name];
  if (!filePath) return new Response('not found', { status: 404 });

  // Sicherheits-Check: nur Dateien INNERHALB des artifacts-Ordners ausliefern.
  // Mit Pfadtrenner prüfen, sonst würde „…/artifacts-demo" fälschlich bestehen.
  const root = path.resolve(process.cwd(), 'artifacts');
  const resolved = path.resolve(filePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep))
    return new Response('forbidden', { status: 403 });

  try {
    const buf = await readFile(resolved);
    return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
  } catch {
    return new Response('not found', { status: 404 });
  }
}
