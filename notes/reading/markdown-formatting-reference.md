---
title: Markdown Formatting Reference
tags: [meta, markdown]
---

# Markdown Formatting Reference

Everything the reader knows how to render, in one page. Handy for checking that
a change to the app did not break anything.

## Text

Regular paragraph text with **bold**, *italic*, ***both***, `inline code`,
~~struck through~~, and a [link to another note](../inbox/example-captured-link.md)
alongside an [external link](https://commonmark.org) that opens in a new tab.

A second paragraph, to check the spacing between them looks right for long
stretches of reading.

## Headings

### Third level

#### Fourth level

##### Fifth level

## Lists

Unordered:

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

Ordered:

1. Step one
2. Step two
3. Step three

Task list:

- [x] Something finished
- [ ] Something outstanding

## Quotes

> A blockquote, for passages worth keeping from whatever you were reading.
>
> It can run to more than one paragraph.

## Code

Inline `const x = 1;` and a fenced block:

```javascript
function readingMinutes(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
```

A long line, to confirm blocks scroll sideways instead of stretching the page:

```
this-is-a-deliberately-long-line-that-will-not-fit-on-a-phone-screen-and-therefore-needs-to-scroll-horizontally
```

## Table

| Folder | Purpose | Typical contents |
| --- | --- | --- |
| `inbox` | Unsorted capture | Links, half-thoughts |
| `reading` | In progress | Articles, book notes |
| `archive` | Finished | Anything kept for reference |

## Rule

---

## Images

Images work with paths relative to the note:

```markdown
![Alt text](diagram.png)
```

Keep them small and next to the note that uses them.
