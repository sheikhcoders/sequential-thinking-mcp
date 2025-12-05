export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🧠 Sequential Thinking MCP Server</h1>
      <p>A remote MCP server for dynamic and reflective problem-solving.</p>
      
      <h2>Endpoints</h2>
      <ul>
        <li><strong>MCP:</strong> <code>/api/mcp</code> (Streamable HTTP)</li>
      </ul>
      
      <h2>Available Tools</h2>
      <ul>
        <li><strong>sequential_thinking</strong> - Step-by-step problem solving</li>
        <li><strong>get_thinking_summary</strong> - Get session summary</li>
        <li><strong>list_thinking_sessions</strong> - List all sessions</li>
        <li><strong>switch_thinking_branch</strong> - Switch thinking branch</li>
        <li><strong>complete_thinking_session</strong> - Complete a session</li>
      </ul>
      
      <h2>Configuration</h2>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px' }}>
{`// Cursor: .cursor/mcp.json
{
  "mcpServers": {
    "sequential-thinking": {
      "url": "${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app'}/api/mcp"
    }
  }
}`}
      </pre>
    </main>
  );
}
