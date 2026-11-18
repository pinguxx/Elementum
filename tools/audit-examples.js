import { components } from '../examples/catalog-data.js';

const suspiciousExamples = [];

for (const [tag, comp] of Object.entries(components)) {
  if (!comp.examples || comp.examples.length === 0) {
    suspiciousExamples.push({ tag, reason: 'No examples at all' });
    continue;
  }
  for (const ex of comp.examples) {
    const code = ex.code ? ex.code.trim() : '';
    if (!code || code === `<${tag}></${tag}>` || code === `<${tag}/>` || code.length < 15) {
      suspiciousExamples.push({ tag, title: ex.title, code, reason: 'Trivial empty code' });
    }
  }
}

console.log('Suspicious/Trivial examples found:', suspiciousExamples.length);
suspiciousExamples.forEach(s => console.log(` - [${s.tag}] ${s.reason}: ${s.code}`));
