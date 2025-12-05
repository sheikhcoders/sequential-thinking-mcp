// Deprecated - use app/api/mcp/route.ts instead
// This file exists only for backward compatibility
export default function handler(req: any, res: any) {
  res.redirect(307, '/api/mcp');
}
