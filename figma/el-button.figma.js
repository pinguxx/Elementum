/**
 * Figma Code Connect configuration for <el-button>
 * Connects the Figma Component canvas directly to Elementum Web Component code.
 *
 * Docs: https://www.figma.com/developers/code-connect
 */

import { figma } from '@figma/code-connect';

export default figma.connect(
  // The Figma component key / URL
  'https://www.figma.com/design/sample-design-system?node-id=101:202',
  {
    props: {
      variant: figma.enum('Variant', {
        Primary: 'primary',
        Secondary: 'secondary',
        Danger: 'danger',
        Ghost: 'ghost',
      }),
      size: figma.enum('Size', {
        Small: 'sm',
        Medium: 'md',
        Large: 'lg',
      }),
      disabled: figma.boolean('Disabled'),
      label: figma.string('Label'),
      hasPrefixIcon: figma.boolean('Has Prefix Icon'),
    },
    example: ({ variant, size, disabled, label, hasPrefixIcon }) => {
      const icon = hasPrefixIcon ? '<span slot="prefix">⚡</span> ' : '';
      const disabledAttr = disabled ? ' disabled' : '';
      return `<el-button variant="${variant}" size="${size}"${disabledAttr}>${icon}${label}</el-button>`;
    },
  }
);
