import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { NoteQueryDto } from '../dto/note-query.dto';
import { Note, NoteDocument } from '../schemas/note.schema';

@Injectable()
export class NotesRepository {
  constructor(
    @InjectModel(Note.name) private readonly noteModel: Model<NoteDocument>
  ) {}

  async create(noteData: {
    title: string;
    content: string;
    owner: Types.ObjectId;
  }): Promise<NoteDocument> {
    const createdNote = new this.noteModel(noteData);
    return createdNote.save();
  }

  async findById(id: string): Promise<NoteDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.noteModel.findById(id).populate('owner', 'name email').exec();
  }

  // Utilizes compound index: { owner: 1, createdAt: -1 }
  async findUserNotes(
    userId: string,
    query: NoteQueryDto
  ): Promise<PaginatedResponse<NoteDocument>> {
    const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const sortDirection = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;
    const filter = { owner: new Types.ObjectId(userId) };

    const [items, total] = await Promise.all([
      this.noteModel
        .find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.noteModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // Admin query: utilizes { createdAt: -1 } or { owner: 1, createdAt: -1 }
  async findAllNotes(
    query: NoteQueryDto
  ): Promise<PaginatedResponse<NoteDocument>> {
    const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc', owner } = query;
    const sortDirection = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

    const filter: Record<string, any> = {};
    if (owner && Types.ObjectId.isValid(owner)) {
      filter.owner = new Types.ObjectId(owner);
    }

    const [items, total] = await Promise.all([
      this.noteModel
        .find(filter)
        .populate('owner', 'name email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.noteModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async updateById(
    id: string,
    updateData: Partial<Note>
  ): Promise<NoteDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.noteModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('owner', 'name email')
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.noteModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
