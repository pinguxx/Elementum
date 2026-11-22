import { ElButton, ElCard } from '@wcomp/elementum';
import { renderComponentToDSD } from '@wcomp/elementum/ssr';

export default function HomePage() {
  // Pre-render Declarative Shadow DOM on server
  const cardDSDHtml = renderComponentToDSD(
    'el-card',
    ElCard,
    { bordered: true },
    `
      <h2 slot="header" style="margin: 0; font-size: 1.25rem;">Declarative Shadow DOM Output</h2>
      <p style="color: #64748b; margin-top: 8px;">
        This card and button were pre-rendered on the server in pure Node.js to eliminate Cumulative Layout Shift (CLS).
      </p>
      <p id="dsd-hydration-status" style="color: #2563eb; font-weight: 500; margin-bottom: 0;">
        Pre-rendered on server (hydrating...)
      </p>
    `
  );

  const buttonDSDHtml = renderComponentToDSD(
    'el-button',
    ElButton,
    { id: 'dsd-action-btn', variant: 'primary' },
    'Click Hydrated DSD Button'
  );

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

      <div dangerouslySetInnerHTML={{ __html: '<el-toaster></el-toaster>' }} />
    </main>
  );
}
