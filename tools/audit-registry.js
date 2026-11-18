import * as fs from 'fs';
import { components } from '../examples/catalog-data.js';

const registryHtml = fs.readFileSync('examples/registry.html', 'utf-8');
const cardMatches = [...registryHtml.matchAll(/<span class="card-name">&lt;([^&>]+)&gt;<\/span>/g)].map(m => m[1]);

const catMatches = [...registryHtml.matchAll(/class="component-card"\s+data-cat="([^"]+)"/g)].map(m => m[1]);
const catCounts = {};
catMatches.forEach(c => { catCounts[c] = (catCounts[c] || 0) + 1; });

console.log('Total catalog components:', Object.keys(components).length);
console.log('Total registry cards:', cardMatches.length);
console.log('Registry category counts:', catCounts);
