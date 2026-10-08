export type Catalog = Record<string, string>;
export function translator(catalog: Catalog) {
  return (key: string, vars: Record<string, string | number> = {}) => {
    const raw = catalog[key] ?? key;
    return raw.replace(/\{([A-Za-z0-9_.-]+)\}/g, (_m, name: string) => String(vars[name] ?? `{${name}}`));
  };
}
