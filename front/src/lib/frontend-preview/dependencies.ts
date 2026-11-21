
export function splitDependencies(value: string | undefined): string[] {
  return value?.split(',')
    .map((dependency) => dependency.trim())
    .filter(Boolean) ?? [];
}

export function dependencyName(value: string): string {
  const scope = /@[a-z0-9._-]+\//;
  const packageName = /[a-z0-9][a-z0-9._-]*/;
  const versionSuffix = /[A-Za-z0-9.*^~<>=|+! _-]+/;

  const fullPackageName = `(?:${scope.source})?${packageName.source}`;
  const optionalVersion = `(?:@(${versionSuffix.source}))?`;

  const pattern = new RegExp(`^(${fullPackageName})${optionalVersion}$`);

  const match = pattern.exec(value.trim());

  if (!match) throw new Error(`Biblioteca inválida: ${value}`);

  return match[1];
}

export function mergeDependencies(...lists: (string[] | undefined)[]): string[] {
  const packages = new Map<string, string>();

  for (const value of lists.flatMap((list) => list ?? [])) {
    const requirement = value.trim();

    if (!requirement) continue;

    const name = dependencyName(requirement);

    if (!packages.has(name)) packages.set(name, requirement);
  }

  return [...packages.values()];
}

