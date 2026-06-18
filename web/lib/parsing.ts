export interface ParsedMarkdownNode {
  type: 'paragraph' | 'text' | 'bold' | 'italic' | 'strikethrough' | 'link' | 'linebreak';
  content?: string;
  children?: ParsedMarkdownNode[];
  href?: string;
}

export interface ParsedMarkdown { nodes: ParsedMarkdownNode[] }

// Overloads
export function parseAirtableMarkdown(markdown: string): ParsedMarkdown;
export function parseAirtableMarkdown(markdown: string, options: { plain: true }): { plainText: string };
export function parseAirtableMarkdown(markdown: string, options?: { plain?: boolean }): ParsedMarkdown | { plainText: string } {
  const wantPlain = options?.plain === true;
  if (!markdown) { return wantPlain ? { plainText: '' } : { nodes: [] }; }
  const cleaned = markdown.replace(/\n$/, '').trim();
  if (!cleaned) { return wantPlain ? { plainText: '' } : { nodes: [] }; }
  const paragraphTexts = cleaned.split(/\n\n+/);
  const paragraphs: ParsedMarkdownNode[] = [];
  const plainParts: string[] = [];
  for (const p of paragraphTexts) {
    const t = p.trim();
    if (!t) continue;
    const children = parseInlineElements(t);
    if (wantPlain) { plainParts.push(flattenInline(children)); } else { paragraphs.push({ type: 'paragraph', children }); }
  }
  if (wantPlain) { return { plainText: normalizePlain(plainParts.join(' ')) }; }
  return { nodes: paragraphs };
}

function parseInlineElements(text: string): ParsedMarkdownNode[] {
  const nodes: ParsedMarkdownNode[] = [];
  let remaining = text;
  // Airtable (and standard Markdown) allow escaping special characters with a leading backslash.
  // Example: "@bayt\_almocha" should surface as "@bayt_almocha" with no italic parsing attempt.
  // We treat a backslash followed by an escapable punctuation character as a literal of that character.
  const escapable = new Set(['\\', '[', ']', '(', ')', '*', '_', '~']);
  while (remaining.length > 0) {
    // Backslash escape handling
    if (remaining[0] === '\\' && remaining.length > 1 && escapable.has(remaining[1])) {
      nodes.push({ type: 'text', content: remaining[1] });
      remaining = remaining.slice(2);
      continue;
    }
    // Match markdown links: [text](url)
    // 
    // The challenge: URLs can contain parentheses (common in Wikipedia URLs like
    // https://en.wikipedia.org/wiki/Page_(film)), which breaks naive regex patterns.
    // 
    // Solution: Use a parenthesis depth counter to find the correct closing paren.
    // - Start with depth=1 for the opening paren in ](
    // - Increment depth for each ( we encounter in the URL
    // - Decrement depth for each ) we encounter
    // - Stop when depth reaches 0 (that's our closing paren)
    // 
    // Example: [Movie](https://wiki.org/Film_(2020)) text after
    //          ^-----^  ^-----------------------^
    //          |        |                       
    //          text     URL with balanced parens
    //                                           ^ stops here (depth 0)
    const linkStart = remaining.match(/^[[]([^\]]*)\]\(/);
    if (linkStart) {
      const urlStart = linkStart[0].length;
      let depth = 1;
      let urlEnd = urlStart;
      // Walk through characters counting parentheses depth
      while (urlEnd < remaining.length && depth > 0) {
        if (remaining[urlEnd] === '(') depth++;
        else if (remaining[urlEnd] === ')') depth--;
        if (depth > 0) urlEnd++;
      }
      if (depth === 0) {
        const linkText = linkStart[1];
        const href = remaining.slice(urlStart, urlEnd);
        const linkTextNodes = parseInlineElements(linkText);
        if (linkTextNodes.length === 1 && linkTextNodes[0].type === 'text') {
          nodes.push({ type: 'link', content: linkTextNodes[0].content, href });
        } else { nodes.push({ type: 'link', children: linkTextNodes, href }); }
        remaining = remaining.slice(urlEnd + 1);
        continue;
      }
    }
    const strikeMatch = remaining.match(/^~~([^~]*(?:~(?!~)[^~]*)*)~~/);
    if (strikeMatch) {
      const strikeNodes = parseInlineElements(strikeMatch[1]);
      if (strikeNodes.length === 1 && strikeNodes[0].type === 'text') { nodes.push({ type: 'strikethrough', content: strikeNodes[0].content }); }
      else { nodes.push({ type: 'strikethrough', children: strikeNodes }); }
      remaining = remaining.slice(strikeMatch[0].length); continue;
    }
    const boldMatch = remaining.match(/^\*\*([^*]*(?:\*(?!\*)[^*]*)*)\*\*/);
    if (boldMatch) {
      const boldNodes = parseInlineElements(boldMatch[1]);
      if (boldNodes.length === 1 && boldNodes[0].type === 'text') { nodes.push({ type: 'bold', content: boldNodes[0].content }); }
      else { nodes.push({ type: 'bold', children: boldNodes }); }
      remaining = remaining.slice(boldMatch[0].length); continue;
    }
    const italicMatch = remaining.match(/^_([^_\n]+)_/);
    if (italicMatch) {
      const italicNodes = parseInlineElements(italicMatch[1]);
      if (italicNodes.length === 1 && italicNodes[0].type === 'text') { nodes.push({ type: 'italic', content: italicNodes[0].content }); }
      else { nodes.push({ type: 'italic', children: italicNodes }); }
      remaining = remaining.slice(italicMatch[0].length); continue;
    }
    if (remaining.startsWith('\n')) { nodes.push({ type: 'linebreak' }); remaining = remaining.slice(1); continue; }
    let nextSpecial = remaining.search(/[\[*~\n]/);
    const italicUnderscoreIndex = findItalicUnderscoreCandidate(remaining);
    if (italicUnderscoreIndex !== -1 && (nextSpecial === -1 || italicUnderscoreIndex < nextSpecial)) { nextSpecial = italicUnderscoreIndex; }
    if (nextSpecial === -1) { if (remaining) nodes.push({ type: 'text', content: remaining }); break; }
    else if (nextSpecial > 0) { nodes.push({ type: 'text', content: remaining.slice(0, nextSpecial) }); remaining = remaining.slice(nextSpecial); }
    else { nodes.push({ type: 'text', content: remaining[0] }); remaining = remaining.slice(1); }
  }
  return nodes;
}

function findItalicUnderscoreCandidate(src: string): number {
  const first = src.indexOf('_');
  if (first === -1) return -1;
  const second = src.indexOf('_', first + 1);
  if (second === -1) return -1;
  const before = first > 0 ? src[first - 1] : '';
  const after = second + 1 < src.length ? src[second + 1] : '';
  const wordChar = /[A-Za-z0-9]/;
  if (wordChar.test(before) && wordChar.test(after)) return -1;
  return first;
}

function flattenInline(nodes: ParsedMarkdownNode[] | undefined): string {
  if (!nodes || nodes.length === 0) return '';
  const tokens: string[] = [];
  for (const n of nodes) {
    switch (n.type) {
      case 'text': if (n.content) tokens.push(n.content); break;
      case 'bold':
      case 'italic':
      case 'strikethrough':
        if (n.children && n.children.length) tokens.push(flattenInline(n.children));
        else if (n.content) tokens.push(n.content);
        break;
      case 'link':
        if (n.children && n.children.length) tokens.push(flattenInline(n.children));
        else if (n.content) tokens.push(n.content);
        else if (n.href) { try { const url = new URL(n.href); tokens.push(url.hostname.replace(/^www\./i, '')); } catch { /* ignore */ } }
        break;
      case 'linebreak': tokens.push(' '); break;
      case 'paragraph': tokens.push(flattenInline(n.children)); break;
      default: break;
    }
  }
  let result = '';
  for (let raw of tokens) {
    if (!raw) continue;
    let token = raw.replace(/\s+/g, ' ').trim();
    if (!token) continue;
    const isPureSpace = token === ' ';
    if (isPureSpace) { if (result && !result.endsWith(' ')) result += ' '; continue; }
    const punctuationStart = /^[,.;:!?)]/.test(token);
    if (!result) { result = token; continue; }
    if (punctuationStart) { result = result.replace(/\s+$/, '') + token; }
    else if (/[\[(]$/.test(result)) { result += token; }
    else if (result.endsWith(' ')) { result += token; }
    else { result += ' ' + token; }
  }
  return result;
}

function normalizePlain(text: string): string {
  return text
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/ \s*([,.;:!?])+/g, (m) => m.trimStart())
    .replace(/\s+([,.;:!?\)\]\}])/g, '$1')
    .trim();
}
