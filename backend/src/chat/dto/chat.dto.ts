import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateChatSessionDto {
  @IsString()
  projectId: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @IsString()
  providerId: string;
}
