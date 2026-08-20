import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';

type TemplateParamLike = {
  id: number;
  name: string;
  type?: TemplateParamType;
};

type TemplateLike = {
  id: number;
  templateParams?: TemplateParamLike[];
};

type AssignmentParamLike = {
  templateParamsId: number;
  value: string;
};

type AssignmentLike = {
  assignmentTemplates: { template: TemplateLike }[];
  assignmentParams: AssignmentParamLike[];
};

function valueToTsLiteral(type: TemplateParamType, raw: string): string {
  switch (type) {
    case TemplateParamType.NUMBER: {
      const n = Number(raw);
      return Number.isFinite(n) ? String(n) : 'NaN';
    }
    case TemplateParamType.BOOLEAN: {
      const v = raw.trim().toLowerCase();
      return v === 'true' || v === '1' ? 'true' : 'false';
    }
    case TemplateParamType.OBJECT: {
      try {
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed);
      } catch {
        return JSON.stringify(raw);
      }
    }
    case TemplateParamType.STRING:
    default:
      return JSON.stringify(raw);
  }
}

export function buildTemplateVariablesModule(assignment: AssignmentLike): string {
  const templates = assignment.assignmentTemplates.map((t) => t.template);
  const templateIds = templates.map((t) => t.id);

  const lines: string[] = [];
  lines.push('/* Auto-generated at runtime */');
  lines.push('');
  lines.push('export type TemplateVars = Record<string, unknown>;');
  lines.push('');
  lines.push(
    `export const templateIds = [${templateIds.map((id) => String(id)).join(', ')}] as const;`,
  );
  lines.push('');
  lines.push(
    'export const firstTemplateId = (templateIds[0] ?? null) as typeof templateIds[number] | null;',
  );
  lines.push('');
  lines.push('export const templates = {');

  for (const template of templates) {
    const params = template.templateParams ?? [];

    lines.push(`  ${template.id}: {`);
    for (const param of params) {
      const raw =
        assignment.assignmentParams.find((p) => p.templateParamsId === param.id)
          ?.value ?? '';
      const paramType = param.type ?? TemplateParamType.STRING;
      const key = JSON.stringify(param.name);
      const literal = valueToTsLiteral(paramType, raw);
      lines.push(`    ${key}: ${literal},`);
    }
    lines.push('  },');
  }

  lines.push('} as const;');
  lines.push('');
  lines.push('export function varsFor(templateId: number): TemplateVars {');
  lines.push('  return (templates as any)[templateId] ?? {};');
  lines.push('}');
  lines.push('');
  lines.push('export function varsForFirstTemplate(): TemplateVars {');
  lines.push('  return firstTemplateId === null ? {} : varsFor(firstTemplateId);');
  lines.push('}');
  lines.push('');
  lines.push('export const vars: TemplateVars = varsForFirstTemplate();');

  return lines.join('\n');
}

type TemplateParamSpec = {
  name: string;
  type?: TemplateParamType;
};

/**
 * Builds the auto-generated `template-variables` module for the template-test
 * preview endpoint, which has no persisted assignment.
 *
 * Treats the single template as `templateIds = [0]` and `firstTemplateId = 0`,
 * matching the layout that `buildTemplateVariablesModule` produces for the
 * real scheduling flow (so existing tests that import `vars` keep working).
 */
export function buildTemplateVariablesModuleFromParams(
  paramValues: Record<string, string>,
  params: TemplateParamSpec[] = [],
): string {
  const lines: string[] = [];
  lines.push('/* Auto-generated at runtime (template-test preview) */');
  lines.push('');
  lines.push('export type TemplateVars = Record<string, unknown>;');
  lines.push('');
  lines.push('export const templateIds = [0] as const;');
  lines.push(
    "export const firstTemplateId = (templateIds[0] ?? null) as typeof templateIds[number] | null;",
  );
  lines.push('');
  lines.push('export const templates = {');
  lines.push('  0: {');
  for (const param of params) {
    const raw = paramValues[param.name] ?? '';
    const paramType = param.type ?? TemplateParamType.STRING;
    const key = JSON.stringify(param.name);
    const literal = valueToTsLiteral(paramType, raw);
    lines.push(`    ${key}: ${literal},`);
  }
  lines.push('  },');
  lines.push('} as const;');
  lines.push('');
  lines.push('export function varsFor(templateId: number): TemplateVars {');
  lines.push('  return (templates as any)[templateId] ?? {};');
  lines.push('}');
  lines.push('');
  lines.push('export function varsForFirstTemplate(): TemplateVars {');
  lines.push(
    '  return firstTemplateId === null ? {} : varsFor(firstTemplateId);',
  );
  lines.push('}');
  lines.push('');
  lines.push('export const vars: TemplateVars = varsForFirstTemplate();');

  return lines.join('\n');
}
