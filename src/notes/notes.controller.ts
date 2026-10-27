import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async createNote(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateNoteDto
  ) {
    return this.notesService.createNote(userId, createDto);
  }

  @Get()
  async getNotes(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query() query: NoteQueryDto
  ) {
    if (userRole === 'admin') {
      return this.notesService.findAllNotes(query);
    }
    return this.notesService.findUserNotes(userId, query);
  }

  @Get(':id')
  async getNoteById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string
  ) {
    return this.notesService.findById(id, userId, userRole);
  }

  @Patch(':id')
  async updateNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateNoteDto
  ) {
    return this.notesService.updateNote(id, userId, updateDto);
  }

  @Delete(':id')
  async deleteNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.notesService.deleteNote(id, userId);
  }
}
