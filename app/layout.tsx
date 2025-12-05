export const metadata = {
  title: 'Sequential Thinking MCP Server',
  description: 'Remote MCP Server for dynamic problem-solving through structured thinking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
