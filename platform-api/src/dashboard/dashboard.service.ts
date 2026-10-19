import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    
    @InjectRepository(Class)
    private readonly classes: Repository<Class>,

    @InjectRepository(Assignment)
    private readonly assignments: Repository<Assignment>
  ) {}

  async getMetrics() {
    const [usersCount, classesCount, assignmentsCount] = await Promise.all([
      this.users.count(),
      this.classes.count(),
      this.assignments.count()
    ]);

    return { usersCount, classesCount, assignmentsCount };
  }
}
