// Download the serving DB from the GitHub release if it's not present.
// Local dev has it from the ETL; Vercel builds fetch it here.
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const DB_URL =
  'https://github.com/mountstorm/whosponsors/releases/download/data-v1/h1b.db';
const dest = path.join(process.cwd(), '..', 'data', 'processed', 'h1b.db');

if (existsSync(dest) && statSync(dest).size > 1_000_000) {
  console.log(`ensure-db: found ${dest}`);
} else {
  console.log(`ensure-db: downloading ${DB_URL}`);
  const res = await fetch(DB_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  mkdirSync(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`ensure-db: wrote ${(statSync(dest).size / 1e6).toFixed(1)} MB`);
}
