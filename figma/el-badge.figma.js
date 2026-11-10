/**
 * Figma Code Connect configuration for <el-badge>
 * Docs: https://www.figma.com/developers/code-connect
 */

import { figma } from '@figma/code-connect';

export default figma.connect(
  'https://www.figma.com/design/sample-design-system?node-id=103:401',
  {
    props: {
      variant: figma.enum('Variant', {
        Default: 'default',
        Success: 'success',
        Danger: 'danger',
      }),
      count: figma.string('Label'),
    },
    example: ({ variant, count }) => {
      return `<el-badge variant="${variant}" count="${count}"></el-badge>`;
    },
  }
);
