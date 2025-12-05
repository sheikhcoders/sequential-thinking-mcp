// Deprecated - use app/api/mcp/route.ts instead
export default function handler(req: any, res: any) {
  res.redirect(307, '/api/mcp');
}
