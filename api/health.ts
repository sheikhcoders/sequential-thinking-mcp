import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    server: 'sequential-thinking-mcp',
    version: '1.1.0',
    transport: ['streamable-http', 'sse'],
    endpoints: {
      mcp: '/api/mcp',
      sse: '/api/sse',
      health: '/api/health',
    },
    timestamp: new Date().toISOString(),
  });
}
