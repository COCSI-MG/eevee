import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileSaverService } from './file-saver.service';
import { UpdateFileEntryDto } from './dto/update-file-saver.dto';
import { FileUploadDto } from './dto/file-operation.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('file-saver')
@UseGuards(JwtAuthGuard) // Protect all routes with JWT authentication
// @UseGuards(JwtAuthGuard)
export class FileSaverController {
  constructor(private readonly fileSaverService: FileSaverService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() fileUploadDto: FileUploadDto,
  ) {
    return this.fileSaverService.uploadFile(file, fileUploadDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileSaverService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFileEntryDto: UpdateFileEntryDto,
  ) {
    return this.fileSaverService.update(+id, updateFileEntryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileSaverService.remove(+id);
  }
}
