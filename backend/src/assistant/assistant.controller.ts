import {
  Controller,
  HttpException,
  Param,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from '../common/types/chat';
import { AssistantService } from './assistant.service';
import { AssistantStreamQueryDto } from './dto/assistant-stream-query.dto';
import { toolLabel } from './agent/tool-labels';

@Controller('conversations/:id/assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Sse('stream')
  stream(
    @CurrentUser() user: PublicUser,
    @Param('id') conversationId: string,
    @Query() dto: AssistantStreamQueryDto,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      this.assistant
        .streamReply(
          { conversationId, userId: user.id, body: dto.body },
          {
            onDelta: (text) =>
              subscriber.next({ type: 'delta', data: { text } }),
            onToolCall: (name) =>
              subscriber.next({
                type: 'tool_call',
                data: { name, label: toolLabel(name) },
              }),
            onToolResult: (name) =>
              subscriber.next({ type: 'tool_result', data: { name } }),
          },
        )
        .then((message) => {
          subscriber.next({ type: 'done', data: { message } });
          subscriber.complete();
        })
        .catch((error: unknown) => {
          subscriber.next({
            type: 'error',
            data: { message: toErrorMessage(error) },
          });
          subscriber.complete();
        });
    });
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    return error.message;
  }
  return 'The assistant failed to generate a response.';
}
