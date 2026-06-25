import { IsNotEmpty, IsString } from 'class-validator';

export class AssistantStreamQueryDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
