import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserRole } from 'src/user/user-role';
import { Repository } from 'typeorm';
import { Class } from 'src/class/entities/class.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Template } from 'src/template/entities/template.entity';

@Injectable()
export class ClassAccessService {
  constructor(
    @InjectRepository(Class) private readonly classes: Repository<Class>,
    @InjectRepository(UserClass) private readonly enrollments: Repository<UserClass>,
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    @InjectRepository(Template) private readonly templates: Repository<Template>,
    private readonly requestContext: RequestContextService,
  ) {}

  user() {
    return this.requestContext.getUser();
  }

  isAdmin() {
    return this.user()?.role === UserRole.ADMIN;
  }

  async assertClassAccess(classId: number, manage = false): Promise<Class> {
    const user = this.user();

    const cls = await this.classes.findOne({
      where: { id: classId },
      withDeleted: user?.role === UserRole.ADMIN
    });

    if (!cls) throw new NotFoundException('Class not found');

    if (user?.role === UserRole.ADMIN) return cls;

    if (user?.role === UserRole.TEACHER && cls.teacherId === user.userId) return cls;

    if (!manage && user?.role === UserRole.STUDENT) {
      const enrollment = await this.enrollments.findOne({ where:
        {
          classId,
          userId: user.userId
        }
      });

      if (enrollment) return cls;
    }

    throw new NotFoundException('Class not found');
  }

  async assertAssignmentAccess(assignmentId: number, manage = false): Promise<Assignment> {
    const assignment = await this.assignments.findOne({ where: { id: assignmentId } });

    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.assertClassAccess(assignment.classId, manage);

    return assignment;
  }

  async assertTemplateAccess(templateId: number, manage = false): Promise<Template> {
    const template = await this.templates.findOne({ where: { id: templateId } })

    if (!template) throw new NotFoundException('Template not found')

    if (template.classId == null) {
      if (this.isAdmin()) return template

      throw new NotFoundException('Template not found')
    }

    await this.assertClassAccess(template.classId, manage)

    return template
  }

  async assertTeacherAssignment(classId: number) {
    const cls = await this.assertClassAccess(classId, true)

    if (
      this.user()?.role !== UserRole.ADMIN &&
      this.user()?.role !== UserRole.TEACHER
    ) {
      throw new ForbiddenException('Only a teacher responsible for this class or an admin can manage it.')
    }

    return cls
  }
}
