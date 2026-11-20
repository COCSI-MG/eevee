import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { TemplateResourceService } from './template-resource.service';
import { storageLimits } from 'src/file-storage/storage-limits';

@Controller('template-resource')
export class TemplateResourceController {
  constructor(private readonly resources: TemplateResourceService) {}

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    get limits() { return { fileSize: storageLimits().maxFileBytes }; },
  }))
  upload(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.resources.upload(Number(id), file);
  }

  @Get('template/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  list(@Param('id') id: string) {
    return this.resources.list(Number(id));
  }
}
