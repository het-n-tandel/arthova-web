import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) return new NextResponse('Missing AMFI code', { status: 400 });

  try {
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!response.ok) throw new Error('MFAPI request failed');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MF API Error:', error);
    return new NextResponse('Failed to fetch mutual fund data', { status: 500 });
  }
}
