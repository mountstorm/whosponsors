import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies } from '@/lib/db';

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.trim().length < 2) return NextResponse.json([]);
  return NextResponse.json(searchCompanies(q));
}