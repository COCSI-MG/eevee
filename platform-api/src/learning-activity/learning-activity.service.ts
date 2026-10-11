import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Class } from 'src/class/entities/class.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { UserRole } from 'src/user/user-role';
import { RequestContextService } from 'src/request-context/request-context.service';
import { LearningActivity } from './entities/learning-activity.entity';
import { LearningQuizAttempt } from './entities/learning-quiz-attempt.entity';
import { LearningActivityKind } from './enums/learning-activity-kind.enum';
import { LearningActivityDto } from './dto/learning-activity.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import {
  canonicalJson,
  gradeQuiz,
  publicQuestions,
  validateActivity,
} from './learning-activity.policy';

@Injectable()
export class LearningActivityService {
  constructor(
    @InjectRepository(LearningActivity)
    private readonly activities: Repository<LearningActivity>,
    private readonly db: DataSource,
    private readonly context: RequestContextService,
  ) {}
  private canManage() {
    const role = this.context.getUser()?.role;
    return role === UserRole.ADMIN || role === UserRole.TEACHER;
  }
  private async access(classId: number, manager = this.db.manager) {
    const user = this.context.getUser();
    if (!user) throw new ForbiddenException();

    const cls = await manager.findOne(Class, { where: { id: classId } });

    if (!cls) throw new NotFoundException();

    if (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.TEACHER && cls.teacherId === user.userId)
    ) return user;

    const classUserManager = await manager.exists(UserClass, {
        where: { classId, userId: user.userId },
      })

    if (
      user.role === UserRole.STUDENT &&
      classUserManager
    ) return user;

    throw new ForbiddenException();
  }
  private visible(activity: LearningActivity) {
    if (
      !this.canManage() &&
      (!activity.published ||
        (activity.startDate && activity.startDate > new Date()))
    )
      throw new NotFoundException();
  }
  private present(activity: LearningActivity) {
    return {
      ...activity,
      questions: this.canManage()
        ? activity.questions
        : publicQuestions(activity.questions),
    };
  }
  private async load(
    id: number,
    manager: EntityManager = this.db.manager,
    lock = false,
  ) {
    const query = manager
      .getRepository(LearningActivity)
      .createQueryBuilder('activity')
      .addSelect('activity.questions')
      .where('activity.id = :id', { id });
    if (lock) query.setLock('pessimistic_write');
    const activity = await query.getOne();
    if (!activity) throw new NotFoundException();
    await this.access(activity.classId, manager);
    this.visible(activity);
    return activity;
  }
  async list(classId: number) {
    await this.access(classId);
    const records = await this.activities.find({
      where: { classId },
      order: { id: 'ASC' },
    });
    return records
      .filter(
        (a) =>
          this.canManage() ||
          (a.published && (!a.startDate || a.startDate <= new Date())),
      )
      .map((a) => this.present(a));
  }
  async get(id: number) {
    return this.present(await this.load(id));
  }
  async create(dto: LearningActivityDto) {
    if (!this.canManage()) throw new ForbiddenException();
    validateActivity(dto);
    await this.access(dto.classId);
    return this.activities.save(
      this.activities.create({
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        practice: dto.practice ?? null,
        questions: dto.questions ?? null,
      }),
    );
  }
  async update(id: number, dto: LearningActivityDto) {
    if (!this.canManage()) throw new ForbiddenException();
    validateActivity(dto);
    return this.db.transaction(async (manager) => {
      const current = await this.load(id, manager, true);
      if (current.classId !== dto.classId || current.kind !== dto.kind)
        throw new BadRequestException(
          'A turma e o tipo não podem ser alterados.',
        );
      if (
        current.kind === LearningActivityKind.QUIZ &&
        current.feedbackReleased &&
        !dto.feedbackReleased
      )
        throw new ConflictException(
          'O resultado já foi liberado. Crie outro questionário para novos envios.',
        );
      if (
        current.kind === LearningActivityKind.QUIZ &&
        (await manager.exists(LearningQuizAttempt, {
          where: { activityId: id },
        })) &&
        canonicalJson(current.questions) !== canonicalJson(dto.questions)
      )
        throw new ConflictException(
          'Há respostas registradas. Crie outro questionário para mudar as questões.',
        );
      return manager.save(LearningActivity, {
        ...current,
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        practice: dto.practice ?? null,
        questions: dto.questions ?? null,
      });
    });
  }
  async submit(id: number, dto: SubmitQuizDto) {
    return this.db.transaction(async (manager) => {
      const activity = await this.load(id, manager, true);
      const userId = this.context.getUser().userId;
      if (this.context.getUser().role !== UserRole.STUDENT)
        throw new BadRequestException(
          'Use uma conta de estudante para enviar respostas.',
        );
      if (activity.kind !== LearningActivityKind.QUIZ || !activity.questions)
        throw new BadRequestException('Esta atividade é de prática.');
      if (activity.dueDate && activity.dueDate < new Date())
        throw new ForbiddenException('Prazo encerrado.');
      const count = await manager.count(LearningQuizAttempt, {
        where: { activityId: id, userId },
      });
      if (count >= activity.maxAttempts)
        throw new ForbiddenException('Limite de tentativas atingido.');
      if (activity.feedbackReleased)
        throw new ForbiddenException(
          'O gabarito já foi liberado. Novos envios estão encerrados.',
        );
      const score = gradeQuiz(activity.questions, dto.answers);
      const saved = await manager.save(
        LearningQuizAttempt,
        manager.create(LearningQuizAttempt, {
          activityId: id,
          userId,
          attempt: count + 1,
          answers: dto.answers,
          score,
        }),
      );
      return {
        id: saved.id,
        attempt: saved.attempt,
        createdAt: saved.createdAt,
        score: null,
      };
    });
  }
  async attempts(id: number) {
    const activity = await this.load(id);
    const user = this.context.getUser();
    const canManage = this.canManage();
    const records = await this.db.getRepository(LearningQuizAttempt).find({
      where: {
        activityId: id,
        ...(canManage ? {} : { userId: user.userId }),
      },
      relations: canManage ? ['user'] : [],
      order: { id: 'DESC' },
      take: 1000,
    });
    const reveal = canManage || activity.feedbackReleased;
    return records.map((a) => ({
      id: a.id,
      attempt: a.attempt,
      userId: a.userId,
      name: canManage ? a.user?.name : undefined,
      createdAt: a.createdAt,
      answers: a.answers,
      score: reveal ? a.score : null,
      feedback: reveal
        ? activity.questions?.map((q) => ({
            questionId: q.id,
            correctChoiceId: q.correctChoiceId,
            explanation: q.explanation,
          }))
        : undefined,
    }));
  }
}
