import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const r = NextResponse.redirect(new URL('/entrar', req.url), 303);
  r.cookies.delete(COOKIE);
  return r;
}
