import { IsString, MaxLength, MinLength } from 'class-validator';
import { TASK_COMMENT_MAX_LENGTH } from '../constants/task.constants';

export class UpdateTaskCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(TASK_COMMENT_MAX_LENGTH)
  content!: string;
}
