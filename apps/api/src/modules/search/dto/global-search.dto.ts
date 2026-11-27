import { IsOptional, IsString } from 'class-validator';

export class GlobalSearchDto {
  @IsOptional()
  @IsString()
  q?: string;
}
