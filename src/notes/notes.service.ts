import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesRepository } from './repositories/notes.repository';
import { NoteResponse, NoteViewModel } from './view-models/note.view-model';

@Injectable()
export class NotesService {
  constructor(private readonly notesRepository: NotesRepository) {}

  async createNote(
    userId: string,
    createDto: CreateNoteDto
  ): Promise<NoteResponse> {
    const note = await this.notesRepository.create({
      title: createDto.title,
      content: createDto.content,
      owner: new Types.ObjectId(userId),
    });
    return NoteViewModel.toViewModel(note);
  }

  async findUserNotes(
    userId: string,
    query: NoteQueryDto
  ): Promise<PaginatedResponse<NoteResponse>> {
    const result = await this.notesRepository.findUserNotes(userId, query);
    return {
      items: NoteViewModel.toViewModelList(result.items),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  // Admin capability: view everyone's notes
  async findAllNotes(
    query: NoteQueryDto
  ): Promise<PaginatedResponse<NoteResponse>> {
    const result = await this.notesRepository.findAllNotes(query);
    return {
      items: NoteViewModel.toViewModelList(result.items),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async findById(
    noteId: string,
    userId: string,
    userRole: string
  ): Promise<NoteResponse> {
    const note = await this.notesRepository.findById(noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID "${noteId}" not found`);
    }

    const noteOwnerId = (note.owner as any)?._id
      ? (note.owner as any)._id.toString()
      : note.owner.toString();

    // Admin can view everyone's notes, regular user can only view their own
    if (userRole !== 'admin' && noteOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this note');
    }

    return NoteViewModel.toViewModel(note);
  }

  async updateNote(
    noteId: string,
    userId: string,
    updateDto: UpdateNoteDto
  ): Promise<NoteResponse> {
    const note = await this.notesRepository.findById(noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID "${noteId}" not found`);
    }

    const noteOwnerId = (note.owner as any)?._id
      ? (note.owner as any)._id.toString()
      : note.owner.toString();

    // Strict ownership enforcement: Users can only update their own notes
    if (noteOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to edit this note');
    }

    const updated = await this.notesRepository.updateById(noteId, updateDto);
    return NoteViewModel.toViewModel(updated);
  }

  async deleteNote(
    noteId: string,
    userId: string
  ): Promise<{ deleted: boolean }> {
    const note = await this.notesRepository.findById(noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID "${noteId}" not found`);
    }

    const noteOwnerId = (note.owner as any)?._id
      ? (note.owner as any)._id.toString()
      : note.owner.toString();

    // Strict ownership enforcement: Users can only delete their own notes
    if (noteOwnerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this note');
    }

    const deleted = await this.notesRepository.deleteById(noteId);
    return { deleted };
  }
}
