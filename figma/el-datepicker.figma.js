/**
 * Figma Code Connect configuration for <el-datepicker>
 * Docs: https://www.figma.com/developers/code-connect
 */

import { figma } from '@figma/code-connect';

export default figma.connect(
  'https://www.figma.com/design/sample-design-system?node-id=105:601',
  {
    props: {
      placeholder: figma.string('Placeholder'),
      value: figma.string('Value'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ placeholder, value, disabled }) => {
      const valAttr = value ? ` value="${value}"` : '';
      const disabledAttr = disabled ? ' disabled' : '';
      return `<el-datepicker placeholder="${placeholder}"${valAttr}${disabledAttr}></el-datepicker>`;
    },
  }
);
