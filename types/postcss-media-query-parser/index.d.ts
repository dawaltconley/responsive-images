declare namespace MediaQuery {
  interface Node {
    type:
      | 'media-query-list' // i.e. '(max-width: 100px), not print'
      | 'media-query' // i.e. '(max-width: 100px)', 'not print'
      | 'media-feature-expression' // i.e. '(max-width: 100px)'
      | 'media-feature' // i.e. 'max-height'
      | 'colon' // i.e. ':'
      | 'value' // i.e. '100px'
      | 'media-type' // i.e. 'print'
      | 'keyword' // i.e. 'not'
    after: string
    before: string
    value: string
    sourceIndex: number
    parent?: MediaQuery.Node
    nodes: MediaQuery.Node[]
  }

  interface List extends Node {
    type: 'media-query-list'
  }
}

declare module 'postcss-media-query-parser' {
  export default function parseMedia(queryString: string): MediaQuery.Node
}
