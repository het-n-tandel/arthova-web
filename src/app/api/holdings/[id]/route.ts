import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { holdings, assetTransactions } from '@/lib/db/schema';
import { auth } from '@/auth';
import { and, eq } from 'drizzle-orm';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const resolvedParams = await params;
  const holdingId = resolvedParams.id;
  const userId = session.user.id;

  await db.transaction(async (tx) => {
    await tx.delete(assetTransactions).where(eq(assetTransactions.holdingId, holdingId));
    await tx.delete(holdings).where(and(eq(holdings.id, holdingId), eq(holdings.userId, userId)));
  });

  return new NextResponse(null, { status: 204 });
}
