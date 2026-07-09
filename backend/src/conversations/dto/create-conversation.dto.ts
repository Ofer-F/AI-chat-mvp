import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { ConversationType } from '../../common/types/chat';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsIn(['human', 'assistant'])
  type?: ConversationType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  participantIds: string[] = [];
}
