import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../generated/prisma/client';

export const TASK_SORT_FIELDS = [
  'dueDate',
  'createdAt',
  'updatedAt',
  'priority',
] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const TASK_SORT_ORDERS = ['asc', 'desc'] as const;
export type TaskSortOrder = (typeof TASK_SORT_ORDERS)[number];

function transformOptionalBoolean({ value }: { value: unknown }): unknown {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}

export class QueryTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @Transform(transformOptionalBoolean)
  @IsBoolean()
  unassigned?: boolean;

  @IsOptional()
  @Transform(transformOptionalBoolean)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy?: TaskSortField;

  @IsOptional()
  @IsIn(TASK_SORT_ORDERS)
  sortOrder?: TaskSortOrder;
}

export class QueryWorkspaceTasksDto extends QueryTasksDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @Transform(transformOptionalBoolean)
  @IsBoolean()
  assignedToMe?: boolean;
}
