import { Assignment } from './entities/assignment.entity';
import { promises as fs } from 'fs';
import * as path from 'path';

export class AssignmentHelper {
  static filterNonUserAssignmentData(
    assignment: Assignment,
    userId: number,
  ): Assignment {
    return {
      ...assignment,
      assignmentAttempts: [
        ...(assignment.assignmentAttempts ?? []).filter(
          (attempt) => attempt.userId === userId,
        ),
      ],
    };
  }

  static async readBoilerplateFileContent(
    boilerplateFilePath?: string,
  ): Promise<string> {
    if (!boilerplateFilePath) return '';

    try {
      const absolutePath = path.resolve(
        process.cwd(),
        'assignments-upload',
        boilerplateFilePath,
      );
      return await fs.readFile(absolutePath, 'utf-8');
    } catch {
      return '';
    }
  }

  static async attachBoilerplate(assignment: Assignment) {
    const boilerplate = await this.readBoilerplateFileContent(
      assignment.boilerplateFilePath,
    );

    return {
      ...assignment,
      // Preferred name
      boilerplate,
      // Backward compatible alias for older frontends
      validationScript: boilerplate,
    };
  }

  static async mapAssignmentsWithBoilerplateAndCorrectUserData(
    assignments: Assignment[],
    user: { userId: number },
  ) {
    return await Promise.all(
      assignments.map((a) =>
        this.attachBoilerplate(
          AssignmentHelper.filterNonUserAssignmentData(a, user.userId),
        ),
      ),
    );
  }
}
