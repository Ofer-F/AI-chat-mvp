import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KnowledgeDocument, PublicUser } from '../common/types/chat';
import { KnowledgeService } from './knowledge.service';
import { isSupportedMimeType } from './parsers/parse-document';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('knowledge/documents')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  async upload(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ document: KnowledgeDocument }> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }
    if (!isSupportedMimeType(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed types: txt, md, pdf.`,
      );
    }

    const document = await this.knowledge.ingestDocument({
      userId: user.id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
    return { document };
  }

  @Get()
  async list(
    @CurrentUser() user: PublicUser,
  ): Promise<{ documents: KnowledgeDocument[] }> {
    return { documents: await this.knowledge.listDocuments(user.id) };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.knowledge.deleteDocument(user.id, id);
  }
}
