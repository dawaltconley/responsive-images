declare module 'postcss-media-query-parser' {
  export default function parseMedia(queryString: string): MediaQueryList

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
      | undefined // invalid
    before: string
    after: string
    value: string
    sourceIndex: number
    parent?: Node
    nodes?: Node[]
  }

  // where does this go?
  interface Undefined extends Node {
    type: undefined
  }

  interface MediaQueryList extends Node {
    type: 'media-query-list'
    nodes: MediaQuery[]
    parent: never
  }

  interface MediaQuery extends Node {
    type: 'media-query'
    nodes: (MediaFeatureExpression | Keyword | MediaType | Undefined)[]
    parent: MediaQueryList
  }

  interface MediaFeatureExpression extends Node {
    type: 'media-feature-expression'
    nodes: [MediaFeature, Colon, Value] | [Node] // singular if feature expression is just a set of parenthesis
    parent: MediaQuery
  }

  interface MediaFeature extends Node {
    type: 'media-feature'
    nodes: never
    parent: MediaFeatureExpression
  }

  interface Colon extends Node {
    type: 'colon'
    nodes: never
    parent: MediaFeatureExpression
    value: ':'
  }

  interface Value extends Node {
    type: 'value'
    nodes: never
    parent: MediaFeatureExpression
  }

  interface MediaType extends Node {
    type: 'media-type'
    nodes: never
    parent: MediaQuery
    // value: 'all' | 'print' | 'screen' | 'tty' | 'tv' | 'projection' | 'handheld' | 'braille' | 'embossed' | 'aural' | 'speech'
  }

  interface Keyword extends Node {
    type: 'keyword'
    nodes: never
    parent: MediaQuery
    // value: 'and' | 'only' | 'not'
  }
}
