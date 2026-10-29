import { createElement, Fragment, type ReactNode } from "react";

export type Vars = Record<string, string | number>;

/** "Bonjour {name}" + { name: "Amina" } -> "Bonjour Amina". Unknown placeholders stay visible. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** Like interpolate, but placeholders may be React nodes (an accented phrase, a link). */
export function interpolateRich(template: string, nodes: Record<string, ReactNode>): ReactNode {
  const parts = template.split(/(\{\w+\})/g);
  return parts.map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    const key = m?.[1];
    const node = key !== undefined && key in nodes ? nodes[key] : part;
    return createElement(Fragment, { key: i }, node);
  });
}
