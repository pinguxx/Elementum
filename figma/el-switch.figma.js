/**
 * Figma Code Connect configuration for <el-switch>
 * Docs: https://www.figma.com/developers/code-connect
 */

import { figma } from '@figma/code-connect';

export default figma.connect(
  'https://www.figma.com/design/sample-design-system?node-id=104:501',
  {
    props: {
      checked: figma.boolean('Checked'),
      disabled: figma.boolean('Disabled'),
      size: figma.enum('Size', {
        Small: 'sm',
        Medium: 'md',
        Large: 'lg',
      }),
      label: figma.string('Label'),
    },
    example: ({ checked, disabled, size, label }) => {
      const checkedAttr = checked ? ' checked' : '';
      const disabledAttr = disabled ? ' disabled' : '';
      return `<el-switch size="${size}"${checkedAttr}${disabledAttr}>${label}</el-switch>`;
    },
  }
);
