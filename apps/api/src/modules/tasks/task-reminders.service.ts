import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { TaskAccessService } from './task-access.service';

@Injectable()
export class TaskRemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  async findAll(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    return this.prisma.taskReminder.findMany({
      where: {
        taskId,
        userId: currentUserId,
      },
      orderBy: {
        remindAt: 'asc',
      },
    });
  }

  async create(
    workspaceId: string,
    projectId: string,
    taskId: string,
    currentUserId: string,
    dto: CreateTaskReminderDto,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    const remindAt = new Date(dto.remindAt);
    if (Number.isNaN(remindAt.getTime())) {
      throw new BadRequestException('Invalid reminder date');
    }

    return this.prisma.taskReminder.create({
      data: {
        taskId,
        userId: currentUserId,
        remindAt,
      },
    });
  }

  async remove(
    workspaceId: string,
    projectId: string,
    taskId: string,
    reminderId: string,
    currentUserId: string,
  ) {
    await this.taskAccessService.assertCanReadProjectTasks(
      workspaceId,
      projectId,
      currentUserId,
    );

    await this.taskAccessService.assertTaskExists(
      workspaceId,
      projectId,
      taskId,
    );

    const existing = await this.prisma.taskReminder.findFirst({
      where: {
        id: reminderId,
        taskId,
        userId: currentUserId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Reminder not found');
    }

    await this.prisma.taskReminder.delete({
      where: { id: reminderId },
    });
  }
}
