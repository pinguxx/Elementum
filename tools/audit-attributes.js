import fs from 'fs';
import path from 'path';
import { components } from '../examples/catalog-data.js';

const files = fs.readdirSync('src/components').filter(f => f.endsWith('.js'));
const tagDetails = {};

for (const f of files) {
  const content = fs.readFileSync(path.join('src/components', f), 'utf8');
  
  // Match customElements.define('tag-name', ClassName)
  const defines = [...content.matchAll(/customElements\.define\(['"]([^'"]+)['"],\s*(\w+)\)/g)];
  for (const def of defines) {
    const tag = def[1];
    const cls = def[2];
    
    // Find class declaration and observedAttributes
    const classRegex = new RegExp(`class\\s+${cls}[^{]*\\{([\\s\\S]*?)(?:\\n\\}\\s*\\n|$\\))`);
    const classMatch = content.match(classRegex);
    const body = classMatch ? classMatch[1] : content;
    
    const obsMatch = body.match(/static\s+observedAttributes\s*=\s*\[([^\]]*)\]/);
    const attrs = obsMatch
      ? obsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
      : [];
      
    tagDetails[tag] = { file: f, cls, attrs };
  }
}

const audit = [];
for (const [tag, info] of Object.entries(tagDetails)) {
  const catComp = components[tag];
  const catProps = catComp ? (catComp.props || []).map(p => p.name) : [];
  const missingAttrs = info.attrs.filter(a => !catProps.includes(a));
  const hasExamples = catComp && catComp.examples && catComp.examples.length > 0 && !catComp.examples[0].code.includes(`<${tag}></${tag}>`);
  
  audit.push({
    tag,
    file: info.file,
    observedAttrs: info.attrs,
    catalogProps: catProps,
    missingInCatalog: missingAttrs,
    needsExamples: !hasExamples
  });
}

const missingPropsCount = audit.filter(a => a.missingInCatalog.length > 0);
const missingExamplesCount = audit.filter(a => a.needsExamples);

console.log(`Audited ${audit.length} registered tags:`);
console.log(`- Tags with missing attributes in catalog: ${missingPropsCount.length}`);
console.log(`- Tags with missing or placeholder examples: ${missingExamplesCount.length}\n`);

for (const item of missingPropsCount) {
  console.log(`[${item.tag}] in ${item.file}`);
  console.log(`  Observed: [${item.observedAttrs.join(', ')}]`);
  console.log(`  Catalog has: [${item.catalogProps.join(', ')}]`);
  console.log(`  Missing in catalog: [${item.missingInCatalog.join(', ')}]`);
  console.log(`  Needs rich examples: ${item.needsExamples}\n`);
}
