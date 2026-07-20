import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  let intervalId: NodeJS.Timeout;
  const mockPrices: Record<string, number> = {
    'RELIANCE': 3000,
    'GOLD': 6500,
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Client disconnected
        }
      };

      // Mock random walk price tick simulation (±0.3% per tick, every 2s)
      intervalId = setInterval(() => {
        const symbols = Object.keys(mockPrices);
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        const currentPrice = mockPrices[symbol];
        const variance = currentPrice * 0.003; 
        const change = (Math.random() - 0.5) * 2 * variance;
        const newPrice = Number((currentPrice + change).toFixed(2));
        
        mockPrices[symbol] = newPrice;

        sendEvent({ 
          type: 'PRICE_UPDATE', 
          payload: { symbol, price: newPrice, timestamp: new Date().toISOString() } 
        });
        
      }, 2000);
    },
    cancel() {
      clearInterval(intervalId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
