/**
 * Pure-JS MCP prompts and argument completion handlers (Node stdio & Vercel Edge compatible).
 */

export const PROMPTS = [
  {
    name: 'add_component',
    title: 'Add Elementum component',
    description: 'Inspect schema, accessibility rules, and tree-shaken setup for an Elementum component.',
    arguments: [
      {
        name: 'tag',
        description: 'Custom element tag name (e.g. el-hold-button, el-tabs).',
        required: true,
      },
      {
        name: 'framework',
        description: 'Target framework: html, react, vue, or svelte.',
        required: false,
      },
    ],
  },
  {
    name: 'build_screen',
    title: 'Compose UI screen',
    description: 'Select Elementum components, tokens, and a tree-shaken bundle plan for a screen.',
    arguments: [
      {
        name: 'goal',
        description: 'Short description of the UI screen or workflow to build.',
        required: true,
      },
      {
        name: 'framework',
        description: 'Target framework: html, react, vue, or svelte.',
        required: false,
      },
    ],
  },
  {
    name: 'audit_markup',
    title: 'Audit Elementum markup',
    description: 'Audit Elementum HTML/JSX markup for WCAG 2.2 AA accessibility and component contract errors.',
    arguments: [
      {
        name: 'html',
        description: 'Markup snippet containing Elementum custom elements.',
        required: true,
      },
    ],
  },
];

export function createPromptHandlers({ allDeclarations, declByTag, getResolvedMetadata, forbiddenProtoKeys }) {
  function buildPromptResult(prompt, args) {
    if (prompt.name === 'add_component') {
      const tag = String(args.tag).trim().toLowerCase();
      const fw = typeof args.framework === 'string' && args.framework.trim()
        ? args.framework.trim().toLowerCase()
        : 'html';
      const decl = declByTag.get(tag);
      const summary = decl
        ? `Manifest summary: <${decl.tagName}> (${decl.description || ''}).`
        : `Note: Inspect get_component_doc for "${tag}".`;
      return {
        description: prompt.description,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Add Elementum component <${tag}> for framework "${fw}".`,
                summary,
                `1. Call get_setup (framework: "${fw}") and get_component_doc (tag: "${tag}").`,
                `2. Call get_bundle_plan (tags: ["${tag}"], framework: "${fw}") for tree-shaken imports.`,
                `3. Call generate_snippet and validate final markup with lint_accessibility and validate_component_usage.`,
              ].join('\n'),
            },
          },
        ],
      };
    }

    if (prompt.name === 'build_screen') {
      const goal = String(args.goal).trim();
      const fw = typeof args.framework === 'string' && args.framework.trim()
        ? args.framework.trim().toLowerCase()
        : 'html';
      return {
        description: prompt.description,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Design and assemble an Elementum UI screen (${fw}) for: ${goal}`,
                '1. Read elementum://setup and call list_components (using category/hasMotion/formAssociated filters) to pick minimal components.',
                '2. Inspect design tokens via elementum://tokens or list_tokens and plan imports with get_bundle_plan.',
                '3. Verify the resulting markup using validate_component_usage and lint_accessibility.',
              ].join('\n'),
            },
          },
        ],
      };
    }

    const html = String(args.html).trim();
    return {
      description: prompt.description,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Audit the following Elementum markup for WCAG 2.2 AA compliance and valid component attributes:',
              '1. Run lint_accessibility on the markup.',
              '2. Run validate_component_usage on the markup.',
              '3. Summarize errors/warnings and suggest minimal fixes.',
              '',
              '```html',
              html,
              '```',
            ].join('\n'),
          },
        },
      ],
    };
  }

  function getPrompt(params) {
    const name = typeof params.name === 'string' ? params.name.trim() : '';
    const prompt = PROMPTS.find((p) => p.name === name);
    if (!prompt) {
      return { error: { code: -32602, message: `Unknown prompt: ${name || '(empty)'}` } };
    }
    const rawArgs = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments)
      ? params.arguments
      : {};
    for (const k of Object.keys(rawArgs)) {
      if (forbiddenProtoKeys.has(k)) {
        return { error: { code: -32602, message: `Invalid argument key: ${k}` } };
      }
    }
    for (const spec of prompt.arguments || []) {
      if (spec.required) {
        const val = Object.hasOwn(rawArgs, spec.name) ? rawArgs[spec.name] : undefined;
        if (typeof val !== 'string' || !val.trim()) {
          return { error: { code: -32602, message: `Missing required prompt argument: ${spec.name}` } };
        }
      }
    }
    return { result: buildPromptResult(prompt, rawArgs) };
  }

  function completeArgument(params) {
    const arg = params.argument && typeof params.argument === 'object' && !Array.isArray(params.argument)
      ? params.argument
      : null;
    const argName = arg && typeof arg.name === 'string' ? arg.name.trim() : '';
    if (!argName) {
      return { error: { code: -32602, message: 'Invalid params: argument.name is required.' } };
    }
    const prefix = typeof arg.value === 'string' ? arg.value.trim().toLowerCase() : '';
    let candidates = [];
    if (argName === 'tag') {
      candidates = allDeclarations.map((d) => d.tagName);
    } else if (argName === 'framework') {
      candidates = ['html', 'react', 'vue', 'svelte', 'angular', 'vanilla', 'next', 'cdn'];
    } else if (argName === 'category') {
      const cats = new Set();
      for (const d of allDeclarations) {
        cats.add(String(getResolvedMetadata(d).category || 'general'));
      }
      candidates = [...cats].sort();
    }
    const matches = candidates.filter((item) => item.toLowerCase().startsWith(prefix));
    const values = matches.slice(0, 100);
    return {
      result: {
        completion: {
          values,
          total: matches.length,
          hasMore: matches.length > values.length,
        },
      },
    };
  }

  return { getPrompt, completeArgument };
}
