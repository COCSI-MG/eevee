import { NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/user/user-role';
import { RequestContextService } from 'src/request-context/request-context.service';
import { ClassAccessService } from './class-access.service';

describe('ClassAccessService', () => {
  const archivedClass = {
    id: 4,
    teacherId: 9,
    deletedAt: new Date()
  }
  ;
  const classes = { findOne: jest.fn() };
  const enrollments = { findOne: jest.fn() };
  const assignments = {};
  const templates = {};
  const requestContext = { getUser: jest.fn() };
  const service = new ClassAccessService(
    classes as any,
    enrollments as any,
    assignments as any,
    templates as any,
    requestContext as unknown as RequestContextService
  );

  beforeEach(() => {
    jest.clearAllMocks();
    classes.findOne.mockResolvedValue(archivedClass);
    enrollments.findOne.mockResolvedValue({ id: 1 });
  });

  it('lets admins inspect archived classes', async () => {
    requestContext.getUser.mockReturnValue({
      userId: 1,
      role: UserRole.ADMIN
    });

    await expect(service.assertClassAccess(4)).resolves.toBe(archivedClass);
    expect(classes.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
      withDeleted: true
    });
  });

  it('limits teachers to their currently assigned classes', async () => {
    requestContext.getUser.mockReturnValue({
      userId: 9,
      role: UserRole.TEACHER
    });
    await expect(service.assertClassAccess(4, true)).resolves.toBe(archivedClass);

    requestContext.getUser.mockReturnValue({
      userId: 10,
      role: UserRole.TEACHER
    });
    await expect(service.assertClassAccess(4)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('limits students to enrolled classes and never grants management access', async () => {
    requestContext.getUser.mockReturnValue({ userId: 20, role: UserRole.STUDENT });
    await expect(service.assertClassAccess(4)).resolves.toBe(archivedClass);
    await expect(service.assertClassAccess(4, true)).rejects.toBeInstanceOf(NotFoundException);
    expect(enrollments.findOne).toHaveBeenCalledWith({ where: { classId: 4, userId: 20 } });
  });
});
