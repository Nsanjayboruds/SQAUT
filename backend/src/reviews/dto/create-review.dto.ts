import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  projectId: string;

  @IsString()
  @IsIn(['SECURITY', 'PERFORMANCE', 'CODE_QUALITY', 'ARCHITECTURE', 'DOCUMENTATION'])
  template: string;

  @IsString()
  @IsIn(['FILE', 'MULTI_FILE', 'PROJECT'])
  scope: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];

  @IsString()
  providerId: string;
}
