import { buildTemplateVariablesModule } from './template-variables.utils';
import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';

describe('buildTemplateVariablesModule', () => {
  it('generates a module with typed literals', () => {
    const assignment = {
      assignmentTemplates: [
        {
          template: {
            id: 123,
            templateParams: [
              { id: 1, name: 'n', type: TemplateParamType.NUMBER },
              { id: 2, name: 'b', type: TemplateParamType.BOOLEAN },
              { id: 3, name: 's', type: TemplateParamType.STRING },
              { id: 4, name: 'o', type: TemplateParamType.OBJECT },
            ],
          },
        },
      ],
      assignmentParams: [
        { templateParamsId: 1, value: '42' },
        { templateParamsId: 2, value: 'true' },
        { templateParamsId: 3, value: 'hello' },
        { templateParamsId: 4, value: '{"x":1}' },
      ],
    };

    const out = buildTemplateVariablesModule(assignment);

    expect(out).toContain('export const templateIds');
    expect(out).toContain('export const firstTemplateId');
    expect(out).toContain('export const templates');
    expect(out).toContain('export function varsForFirstTemplate');
    expect(out).toContain('export const vars');
    expect(out).toContain('123:');

    // Ensure literals look right in the generated TS
    expect(out).toContain('"n": 42');
    expect(out).toContain('"b": true');
    expect(out).toContain('"s": "hello"');
    expect(out).toContain('"o": {"x":1}');
  });

  it('OBJECT falls back to string when JSON parse fails', () => {
    const assignment = {
      assignmentTemplates: [
        {
          template: {
            id: 1,
            templateParams: [{ id: 10, name: 'o', type: TemplateParamType.OBJECT }],
          },
        },
      ],
      assignmentParams: [{ templateParamsId: 10, value: 'not json' }],
    };

    const out = buildTemplateVariablesModule(assignment);
    expect(out).toContain('export function varsForFirstTemplate');
    expect(out).toContain('"o": "not json"');
  });

  it('BOOLEAN treats only true/1 as true', () => {
    const assignment = {
      assignmentTemplates: [
        {
          template: {
            id: 1,
            templateParams: [{ id: 11, name: 'b', type: TemplateParamType.BOOLEAN }],
          },
        },
      ],
      assignmentParams: [{ templateParamsId: 11, value: 'yes' }],
    };

    const out = buildTemplateVariablesModule(assignment);
    expect(out).toContain('export const templateIds');
    expect(out).toContain('"b": false');
  });
});
