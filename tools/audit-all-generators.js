import { components } from '../examples/catalog-data.js';
import fs from 'fs';

const indexHtml = fs.readFileSync('examples/index.html', 'utf8');

const bcmMatch = indexHtml.match(/function buildComponentMarkup\(comp, props\) \{([\s\S]*?)\n    \/\/ 8\. Update Live/);
if (!bcmMatch) {
  console.error('Could not find buildComponentMarkup');
  process.exit(1);
}
const bcmCode = bcmMatch[1];

const missing = [];
const checked = [];

for (const [tag, comp] of Object.entries(components)) {
  const propNames = (comp.props || []).map(p => p.name);
  // Check if tag is specifically handled
  const hasTag = bcmCode.includes(`'${tag}'`) || bcmCode.includes(`"${tag}"`);
  if (!hasTag) {
    missing.push({ tag, props: propNames });
  } else {
    // Check if all props are referenced in the handler
    // Find the code block for this tag
    const idx = bcmCode.indexOf(`'${tag}'`);
    const block = bcmCode.slice(idx, idx + 800);
    const unreferencedProps = propNames.filter(pr => !block.includes(`.${pr}`) && !block.includes(`['${pr}']`) && !block.includes(`p.${pr}`));
    checked.push({ tag, props: propNames, unreferencedProps });
  }
}

console.log('=== UNHANDLED TAGS (' + missing.length + ') ===');
for (const m of missing) {
  console.log(`${m.tag}: [${m.props.join(', ')}]`);
}

console.log('\n=== HANDLED BUT POTENTIALLY MISSING PROPS ===');
for (const c of checked) {
  if (c.unreferencedProps.length > 0) {
    console.log(`${c.tag}: unreferenced -> [${c.unreferencedProps.join(', ')}] (all props: [${c.props.join(', ')}])`);
  }
}
