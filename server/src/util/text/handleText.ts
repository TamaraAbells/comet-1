import { filterXSS } from 'xss'

const whiteList: any = {
  a: ['target', 'href', 'title', 'rel'],
  p: [],
  strong: [],
  em: [],
  s: [],
  u: [],
  code: [],
  h1: [],
  h2: [],
  h3: [],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  pre: [],
  hr: [],
  br: []
}

export const handleText = (text: string) =>
  filterXSS(text.replace(/<[^/>][^>]*><\/[^>]+>/, ''), { whiteList })
