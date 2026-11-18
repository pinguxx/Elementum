import { components } from '../examples/catalog-data.js';

// We can check which components have explicit handlers in index.html
import * as fs from 'fs';
const indexHtml = fs.readFileSync('examples/index.html', 'utf-8');

const handledTags = [];
const regex = /if\s*\(\s*tag\s*===\s*'([^']+)'(?:\s*\|\|\s*tag\s*===\s*'([^']+)')?/g;
let match;
while ((match = regex.exec(indexHtml)) !== null) {
  handledTags.push(match[1]);
  if (match[2]) handledTags.push(match[2]);
}

const allTags = Object.keys(components);
const unhandled = allTags.filter(t => !handledTags.includes(t));

console.log('Explicitly handled in buildComponentMarkup (' + handledTags.length + ')');
console.log('Unhandled tags falling back to generic (' + unhandled.length + '):');
unhandled.forEach(t => console.log(' - ' + t));
