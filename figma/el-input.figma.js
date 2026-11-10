/**
 * Figma Code Connect configuration for <el-input>
 * Docs: https://www.figma.com/developers/code-connect
 */

import { figma } from '@figma/code-connect';

export default figma.connect(
  'https://www.figma.com/design/sample-design-system?node-id=102:301',
  {
    props: {
      placeholder: figma.string('Placeholder'),
      disabled: figma.boolean('Disabled'),
      size: figma.enum('Size', {
        Small: 'sm',
        Medium: 'md',
        Large: 'lg',
      }),
      hasPrefix: figma.boolean('Has Prefix Icon'),
      hasSuffix: figma.boolean('Has Suffix Icon'),
    },
    example: ({ placeholder, disabled, size, hasPrefix, hasSuffix }) => {
      const disabledAttr = disabled ? ' disabled' : '';
      const prefixSlot = hasPrefix ? '\n  <span slot="prefix">🔍</span>' : '';
      const suffixSlot = hasSuffix ? '\n  <span slot="suffix">✕</span>' : '';
      return `<el-input placeholder="${placeholder}" size="${size}"${disabledAttr}>${prefixSlot}${suffixSlot}\n</el-input>`;
    },
  }
);
