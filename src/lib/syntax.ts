const raw = (strings: TemplateStringsArray, ...values: unknown[]) =>
  String.raw({ raw: strings }, ...values)

export { raw as html, raw as css, raw as scss }
