import { readFile } from 'node:fs/promises';

export interface RosterCourse {
  name: string;
  students: string[];
}

const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleUpperCase('pt-BR');

/** Parse the pasted CEFET roster without altering its original display names. */
export function parseCefetRoster(text: string): RosterCourse[] {
  const courses: RosterCourse[] = [];
  let current: RosterCourse | undefined;
  let separated = true;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { separated = true; continue; }
    const looksLikeCourse = separated || !/^[A-ZÀ-Ý]+(?: [A-ZÀ-Ý]+)*$/.test(line);
    if (looksLikeCourse && (!current || current.students.length > 0)) {
      current = { name: line, students: [] };
      courses.push(current);
      separated = false;
      continue;
    }
    if (!current) throw new Error(`Roster student appears before a course: ${line}`);
    if (!current.students.some((student) => normalize(student) === normalize(line))) {
      current.students.push(line);
    }
    separated = false;
  }
  return courses;
}

export async function readCefetRoster(path: string): Promise<RosterCourse[]> {
  return parseCefetRoster(await readFile(path, 'utf8'));
}

if (require.main === module) {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: ts-node scripts/cefet-roster.ts <roster.txt>');
  readCefetRoster(path).then((courses) => {
    console.log(JSON.stringify(courses.map((course) => ({
      course: course.name,
      students: course.students.length,
    })), null, 2));
  });
}
