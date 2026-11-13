export function dependencyName(value: string): string {

  const scope = /@[a-z0-9._-]+\//;
  const packageName = /[a-z0-9][a-z0-9._-]*/;
  const versionOrTag = /[A-Za-z0-9.*^~<>=|+! _-]+/;

  const pattern = new RegExp(
    `^(
        (?:${scope.source})?${packageName.source})` + `(?:@(${versionOrTag.source})
      )?$
    `
  );

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

export function shellArgument(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}
