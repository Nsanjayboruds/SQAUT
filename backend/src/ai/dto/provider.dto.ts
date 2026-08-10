import { IsString, IsOptional, IsUrl, MinLength, MaxLength, IsIn } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(['openai', 'lmstudio', 'ollama', 'custom'])
  type: string;

  @IsString()
  @MinLength(1)
  baseUrl: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  modelName: string;
}

export class UpdateProviderDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['openai', 'lmstudio', 'ollama', 'custom'])
  type?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  baseUrl?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  modelName?: string;
}
