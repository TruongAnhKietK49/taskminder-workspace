import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  WORKSPACE_DESCRIPTION_MAX_LENGTH,
  WORKSPACE_NAME_MAX_LENGTH,
} from '../constants/workspace.constants';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(WORKSPACE_DESCRIPTION_MAX_LENGTH)
  description!: string;
}
