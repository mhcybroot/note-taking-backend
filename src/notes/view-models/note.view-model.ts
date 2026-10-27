import { NoteDocument } from '../schemas/note.schema';

export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  owner: string | any;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class NoteViewModel {
  static toViewModel(note: NoteDocument | any): NoteResponse {
    if (!note) return null;
    return {
      id: note._id?.toString() || note.id,
      title: note.title,
      content: note.content,
      owner: note.owner?._id
        ? {
            id: note.owner._id.toString(),
            name: note.owner.name,
            email: note.owner.email,
          }
        : note.owner?.toString() || note.owner,
      isArchived: !!note.isArchived,
      createdAt: note.createdAt?.toISOString ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt?.toISOString ? note.updatedAt.toISOString() : note.updatedAt,
    };
  }

  static toViewModelList(notes: (NoteDocument | any)[]): NoteResponse[] {
    return notes.map((note) => this.toViewModel(note));
  }
}
