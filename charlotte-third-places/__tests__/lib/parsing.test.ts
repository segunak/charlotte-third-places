import { describe, it, expect } from 'vitest'
import {
  parseAirtableMarkdown,
  type ParsedMarkdownNode,
} from '@/lib/parsing'

describe('parseAirtableMarkdown', () => {
  describe('basic parsing', () => {
    it('returns empty nodes for empty string', () => {
      const result = parseAirtableMarkdown('')
      expect(result.nodes).toEqual([])
    })

    it('returns empty nodes for whitespace-only string', () => {
      const result = parseAirtableMarkdown('   ')
      expect(result.nodes).toEqual([])
    })

    it('parses plain text into a paragraph', () => {
      const result = parseAirtableMarkdown('Hello world')
      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].type).toBe('paragraph')
      expect(result.nodes[0].children?.[0]).toEqual({
        type: 'text',
        content: 'Hello world',
      })
    })

    it('splits multiple paragraphs on double newlines', () => {
      const result = parseAirtableMarkdown('First paragraph\n\nSecond paragraph')
      expect(result.nodes).toHaveLength(2)
      expect(result.nodes[0].type).toBe('paragraph')
      expect(result.nodes[1].type).toBe('paragraph')
    })
  })

  describe('inline formatting', () => {
    it('parses bold text', () => {
      const result = parseAirtableMarkdown('This is **bold** text')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      expect(children).toHaveLength(3)
      expect(children[0]).toEqual({ type: 'text', content: 'This is ' })
      expect(children[1]).toEqual({ type: 'bold', content: 'bold' })
      expect(children[2]).toEqual({ type: 'text', content: ' text' })
    })

    it('parses italic text', () => {
      const result = parseAirtableMarkdown('This is _italic_ text')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      expect(children).toHaveLength(3)
      expect(children[0]).toEqual({ type: 'text', content: 'This is ' })
      expect(children[1]).toEqual({ type: 'italic', content: 'italic' })
      expect(children[2]).toEqual({ type: 'text', content: ' text' })
    })

    it('parses strikethrough text', () => {
      const result = parseAirtableMarkdown('This is ~~struck~~ text')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      expect(children).toHaveLength(3)
      expect(children[0]).toEqual({ type: 'text', content: 'This is ' })
      expect(children[1]).toEqual({ type: 'strikethrough', content: 'struck' })
      expect(children[2]).toEqual({ type: 'text', content: ' text' })
    })

    it('parses nested formatting (bold inside italic)', () => {
      const result = parseAirtableMarkdown('_italic with **bold** inside_')
      const paragraph = result.nodes[0]
      const italicNode = paragraph.children?.[0]
      
      expect(italicNode?.type).toBe('italic')
      expect(italicNode?.children).toBeDefined()
    })
  })

  describe('link parsing', () => {
    it('parses simple markdown links', () => {
      const result = parseAirtableMarkdown('Visit [Google](https://google.com)')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      expect(children).toHaveLength(2)
      expect(children[0]).toEqual({ type: 'text', content: 'Visit ' })
      expect(children[1]).toEqual({
        type: 'link',
        content: 'Google',
        href: 'https://google.com',
      })
    })

    it('handles URLs with parentheses (Wikipedia style)', () => {
      const result = parseAirtableMarkdown('[Movie](https://en.wikipedia.org/wiki/Film_(2020))')
      const paragraph = result.nodes[0]
      const linkNode = paragraph.children?.[0]
      
      expect(linkNode?.type).toBe('link')
      expect(linkNode?.href).toBe('https://en.wikipedia.org/wiki/Film_(2020)')
    })

    it('parses link text with formatting', () => {
      const result = parseAirtableMarkdown('[**Bold Link**](https://example.com)')
      const paragraph = result.nodes[0]
      const linkNode = paragraph.children?.[0]
      
      expect(linkNode?.type).toBe('link')
      expect(linkNode?.children).toBeDefined()
      expect(linkNode?.children?.[0]?.type).toBe('bold')
    })
  })

  describe('escape handling', () => {
    it('handles backslash escapes', () => {
      const result = parseAirtableMarkdown('@bayt\\_almocha')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      // Should have text nodes that when combined form "@bayt_almocha"
      const fullText = children
        .filter((n: ParsedMarkdownNode) => n.type === 'text')
        .map((n: ParsedMarkdownNode) => n.content)
        .join('')
      
      expect(fullText).toContain('_')
    })
  })

  describe('plain text extraction', () => {
    it('extracts plain text from simple markdown', () => {
      const result = parseAirtableMarkdown('Hello world', { plain: true })
      expect(result.plainText).toBe('Hello world')
    })

    it('extracts plain text from formatted content', () => {
      const result = parseAirtableMarkdown('This is **bold** and _italic_', { plain: true })
      expect(result.plainText).toBe('This is bold and italic')
    })

    it('extracts plain text from links', () => {
      const result = parseAirtableMarkdown('Visit [Google](https://google.com)', { plain: true })
      expect(result.plainText).toBe('Visit Google')
    })

    it('handles multiple paragraphs', () => {
      const result = parseAirtableMarkdown('First paragraph\n\nSecond paragraph', { plain: true })
      expect(result.plainText).toBe('First paragraph Second paragraph')
    })

    it('returns empty string for empty input', () => {
      const result = parseAirtableMarkdown('', { plain: true })
      expect(result.plainText).toBe('')
    })
  })

  describe('line breaks', () => {
    it('handles single line breaks within paragraphs', () => {
      const result = parseAirtableMarkdown('Line one\nLine two')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      const hasLinebreak = children.some((n: ParsedMarkdownNode) => n.type === 'linebreak')
      expect(hasLinebreak).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles trailing newlines', () => {
      const result = parseAirtableMarkdown('Hello world\n')
      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].children?.[0]?.content).toBe('Hello world')
    })

    it('handles multiple consecutive newlines', () => {
      const result = parseAirtableMarkdown('Para one\n\n\n\nPara two')
      expect(result.nodes).toHaveLength(2)
    })

    it('handles mixed formatting in one paragraph', () => {
      const result = parseAirtableMarkdown('**Bold**, _italic_, and ~~struck~~')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      const types = children.map((n: ParsedMarkdownNode) => n.type)
      expect(types).toContain('bold')
      expect(types).toContain('italic')
      expect(types).toContain('strikethrough')
    })

    it('handles unclosed formatting gracefully', () => {
      // Unclosed bold should be treated as text
      const result = parseAirtableMarkdown('This is **not closed')
      expect(result.nodes).toHaveLength(1)
    })

    it('handles empty link text', () => {
      const result = parseAirtableMarkdown('[](https://example.com)')
      const paragraph = result.nodes[0]
      const linkNode = paragraph.children?.[0]
      
      expect(linkNode?.type).toBe('link')
      expect(linkNode?.href).toBe('https://example.com')
    })

    it('handles link without URL', () => {
      const result = parseAirtableMarkdown('[text]()')
      const paragraph = result.nodes[0]
      const linkNode = paragraph.children?.[0]
      
      expect(linkNode?.type).toBe('link')
      expect(linkNode?.content).toBe('text')
      expect(linkNode?.href).toBe('')
    })

    it('handles underscores within words (not italic)', () => {
      // Underscores in the middle of words like snake_case should not trigger italic
      const result = parseAirtableMarkdown('variable_name_here is a var')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      // Should not parse as italic
      const hasItalic = children.some((n: ParsedMarkdownNode) => n.type === 'italic')
      expect(hasItalic).toBe(false)
    })

    it('handles multiple special characters in sequence', () => {
      const result = parseAirtableMarkdown('***text***')
      expect(result.nodes).toHaveLength(1)
    })

    it('handles strikethrough with tildes inside', () => {
      const result = parseAirtableMarkdown('~~struck~text~~')
      const paragraph = result.nodes[0]
      const strikeNode = paragraph.children?.[0]
      
      expect(strikeNode?.type).toBe('strikethrough')
    })

    it('handles multiple links in one paragraph', () => {
      const result = parseAirtableMarkdown('[Link1](https://one.com) and [Link2](https://two.com)')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      const links = children.filter((n: ParsedMarkdownNode) => n.type === 'link')
      expect(links).toHaveLength(2)
    })

    it('handles escaped asterisks', () => {
      const result = parseAirtableMarkdown('Use \\*asterisks\\* for emphasis')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      // Should have literal asterisks, not bold
      const hasBold = children.some((n: ParsedMarkdownNode) => n.type === 'bold')
      expect(hasBold).toBe(false)
    })

    it('handles escaped brackets', () => {
      const result = parseAirtableMarkdown('\\[not a link\\]')
      const paragraph = result.nodes[0]
      const children = paragraph.children || []
      
      // Should have literal brackets, not a link
      const hasLink = children.some((n: ParsedMarkdownNode) => n.type === 'link')
      expect(hasLink).toBe(false)
    })

    it('handles deeply nested parentheses in URLs', () => {
      const result = parseAirtableMarkdown('[Complex](https://example.com/path_(with_(nested))_parens)')
      const paragraph = result.nodes[0]
      const linkNode = paragraph.children?.[0]
      
      expect(linkNode?.type).toBe('link')
      expect(linkNode?.href).toBe('https://example.com/path_(with_(nested))_parens')
    })
  })

  describe('plain text advanced cases', () => {
    it('handles strikethrough in plain text extraction', () => {
      const result = parseAirtableMarkdown('This is ~~struck~~ out', { plain: true })
      expect(result.plainText).toBe('This is struck out')
    })

    it('handles line breaks in plain text extraction', () => {
      const result = parseAirtableMarkdown('Line one\nLine two', { plain: true })
      expect(result.plainText).toBe('Line one Line two')
    })

    it('normalizes multiple spaces in plain text', () => {
      const result = parseAirtableMarkdown('Too   many    spaces', { plain: true })
      expect(result.plainText).toBe('Too many spaces')
    })

    it('handles punctuation spacing in plain text', () => {
      const result = parseAirtableMarkdown('Hello , world !', { plain: true })
      // Should normalize punctuation spacing
      expect(result.plainText).toMatch(/Hello[,\s]+world/)
    })

    it('handles link without text falling back to hostname', () => {
      // When a link has no text, plain text extraction uses the hostname
      const result = parseAirtableMarkdown('[](https://www.example.com/path)', { plain: true })
      // Should extract hostname
      expect(result.plainText).toBe('example.com')
    })
  })
})
