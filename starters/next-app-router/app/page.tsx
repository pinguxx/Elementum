import { renderComponentToDSD } from '@wcomp/elementum/ssr';

export default function HomePage() {
  // Pre-render Declarative Shadow DOM on server
  const cardDSDHtml = renderComponentToDSD('el-card', {
    bordered: true,
    children: `
      <h2 slot="header" style="margin: 0; font-size: 1.25rem;">Declarative Shadow DOM Output</h2>
      <p style="color: #64748b; margin-top: 8px;">
        This card and button were pre-rendered on the server in pure Node.js to eliminate Cumulative Layout Shift (CLS).
      </p>
    `
  });

  const buttonDSDHtml = renderComponentToDSD('el-button', {
    variant: 'primary',
    children: 'Server Rendered Button'
  });

  return (
    <main style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Next.js App Router + Elementum DSD</h1>
      
      <div 
        dangerouslySetInnerHTML={{ __html: cardDSDHtml }} 
        style={{ marginBottom: '16px' }}
      />
      
      <div 
        dangerouslySetInnerHTML={{ __html: buttonDSDHtml }} 
      />
    </main>
  );
}
