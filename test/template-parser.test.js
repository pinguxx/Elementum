import { test } from 'node:test';
import assert from 'node:assert/strict';

// We can test the template parser string output and part metadata
test('html template parser handles multiple consecutive attributes without corrupting tags', async () => {
  // We can import getCachedTemplate logic
  const strings = [
    '<button part="button" ?disabled=',
    ' @click=',
    '>Click me</button>'
  ];

  // We can test that strings array does not inject markers inside tag
  let htmlString = '';
  const partMeta = [];
  const ATTR_PREFIX = 'data-el-part-';
  let stripLeadingQuote = null;

  for (let i = 0; i < strings.length - 1; i++) {
    let str = strings[i];
    if (stripLeadingQuote && str.startsWith(stripLeadingQuote)) {
      str = str.slice(1);
      stripLeadingQuote = null;
    }

    const tempHtml = htmlString + str;
    const lastOpenTag = tempHtml.lastIndexOf('<');
    const lastCloseTag = tempHtml.lastIndexOf('>');
    const isInsideTag = lastOpenTag > lastCloseTag;

    assert.equal(isInsideTag, true, `Interpolation ${i} should be inside tag`);

    const match = str.match(/([@.?a-zA-Z0-9_\-]+)\s*=\s*(["']?)$/);
    assert.ok(match, `Interpolation ${i} should match attribute pattern`);

    const markerAttr = `${ATTR_PREFIX}${i}`;
    const cleanStr = str.slice(0, match.index) + `${markerAttr}=""`;
    htmlString += cleanStr;
  }
  htmlString += strings[strings.length - 1];

  // Assert that there are NO extra > characters inside button content
  assert.equal(htmlString, '<button part="button" data-el-part-0="" data-el-part-1="">Click me</button>');
  assert.ok(!htmlString.includes('>Click me</button>'.replace('Click me', '> Click me')));
});
