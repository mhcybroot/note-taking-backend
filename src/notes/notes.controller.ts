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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@ApiTags('Notes')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiOperation({ summary: 'Create a new personal note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @Post()
  async createNote(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateNoteDto
  ) {
    return this.notesService.createNote(userId, createDto);
  }

  @ApiOperation({
    summary: 'List notes (paginated)',
    description:
      'Regular users retrieve their own notes (indexed by { owner: 1, createdAt: -1 }). Admins view notes across all users (indexed by { createdAt: -1 }).',
  })
  @ApiResponse({ status: 200, description: 'Paginated note list' })
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

  @ApiOperation({
    summary: 'Get note by ID',
    description:
      'Regular users can only view their own notes. Admins can view any note platform-wide.',
  })
  @ApiResponse({ status: 200, description: 'Note returned' })
  @ApiResponse({ status: 403, description: 'Forbidden (foreign note for non-admin)' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @Get(':id')
  async getNoteById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string
  ) {
    return this.notesService.findById(id, userId, userRole);
  }

  @ApiOperation({
    summary: 'Update own note',
    description:
      'Strict ownership enforcement: Users can ONLY update their own notes. Admins are strictly forbidden from altering foreign notes.',
  })
  @ApiResponse({ status: 200, description: 'Note updated' })
  @ApiResponse({ status: 403, description: 'Forbidden (attempted modification of another user\'s note)' })
  @Patch(':id')
  async updateNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateNoteDto
  ) {
    return this.notesService.updateNote(id, userId, updateDto);
  }

  @ApiOperation({
    summary: 'Delete own note',
    description:
      'Strict ownership enforcement: Users can ONLY delete their own notes. Admins are strictly forbidden from deleting foreign notes.',
  })
  @ApiResponse({ status: 200, description: 'Note deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden (attempted deletion of another user\'s note)' })
  @Delete(':id')
  async deleteNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.notesService.deleteNote(id, userId);
  }
}
