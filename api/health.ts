// Health check endpoint
export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'ok', endpoint: '/api/mcp' });
}
