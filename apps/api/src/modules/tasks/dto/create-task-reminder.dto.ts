import { IsISO8601 } from 'class-validator';

export class CreateTaskReminderDto {
  @IsISO8601()
  remindAt!: string;
}
