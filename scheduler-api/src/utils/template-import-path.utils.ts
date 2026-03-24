import * as path from 'path';

function toPosixPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function ensureRelativeSpecifier(value: string): string {
  if (value === '') return './';
  if (value.startsWith('.') || value.startsWith('/')) return value;
  return `./${value}`;
}

function normalizeCandidateSpecifier(options: {
  specifier: string;
  normalizedSrcBase: string;
  relativeSrcFromTest: string;
}): string {
  const { specifier, normalizedSrcBase, relativeSrcFromTest } = options;

  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return specifier;
  }

  const posixSpecifier = toPosixPath(specifier);

  const srcBaseToken = `${normalizedSrcBase}/`;
  if (posixSpecifier.startsWith(srcBaseToken)) {
    const suffix = posixSpecifier.slice(srcBaseToken.length);
    return ensureRelativeSpecifier(path.posix.join(relativeSrcFromTest, suffix));
  }

  const sourceSegments = posixSpecifier.split('/').filter(Boolean);
  const srcIndex = sourceSegments.lastIndexOf('src');
  if (srcIndex === -1) {
    if (posixSpecifier.startsWith('.')) {
      const cleanedRelative = posixSpecifier.replace(/^\.\.?\//, '');
      const isSimpleEntryImport =
        cleanedRelative.length > 0 && !cleanedRelative.includes('/');

      if (isSimpleEntryImport) {
        return ensureRelativeSpecifier(
          path.posix.join(relativeSrcFromTest, cleanedRelative),
        );
      }
    }

    return specifier;
  }

  const suffixSegments = sourceSegments.slice(srcIndex + 1);
  const suffix = suffixSegments.join('/');
  return ensureRelativeSpecifier(path.posix.join(relativeSrcFromTest, suffix));
}

function rewriteSpecifierLiterals(
  content: string,
  mapper: (specifier: string) => string,
): string {
  const fromRegex = /(from\s+['"])([^'"\n]+)(['"])/g;
  const dynamicImportRegex = /(import\(\s*['"])([^'"\n]+)(['"]\s*\))/g;
  const requireRegex = /(require\(\s*['"])([^'"\n]+)(['"]\s*\))/g;
  const fromWithoutQuotesRegex = /(from\s+)([./][^\s;'"\n]+)(\s*;?)/g;

  let rewritten = content.replace(fromRegex, (_m, p1, p2, p3) => {
    const next = mapper(p2);
    return `${p1}${next}${p3}`;
  });

  rewritten = rewritten.replace(dynamicImportRegex, (_m, p1, p2, p3) => {
    const next = mapper(p2);
    return `${p1}${next}${p3}`;
  });

  rewritten = rewritten.replace(requireRegex, (_m, p1, p2, p3) => {
    const next = mapper(p2);
    return `${p1}${next}${p3}`;
  });

  rewritten = rewritten.replace(fromWithoutQuotesRegex, (_m, p1, p2, p3) => {
    const next = mapper(p2);
    const suffix = p3.includes(';') ? p3 : `${p3};`;
    return `${p1}'${next}'${suffix}`;
  });

  return rewritten;
}

export function normalizeTemplateImportPaths(options: {
  content: string;
  srcPath: string;
  testPath: string;
}): string {
  const normalizedSrcBase = path.posix.normalize(toPosixPath(options.srcPath));
  const normalizedTestBase = path.posix.normalize(toPosixPath(options.testPath));

  const relativeRaw = path.posix.relative(normalizedTestBase, normalizedSrcBase);
  const relativeSrcFromTest = ensureRelativeSpecifier(relativeRaw || '.');

  return rewriteSpecifierLiterals(options.content, (specifier) =>
    normalizeCandidateSpecifier({
      specifier,
      normalizedSrcBase,
      relativeSrcFromTest,
    }),
  );
}
