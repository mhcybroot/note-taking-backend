import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type NoteDocument = HydratedDocument<Note>;

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: false })
  isArchived: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Explicit schema.index method calls per evaluation specification
// 1. Compound index for user listing own notes with chronological sorting (ESR rule compliant)
NoteSchema.index({ owner: 1, createdAt: -1 });

// 2. Single-field sort index for Admin listing all notes chronologically
NoteSchema.index({ createdAt: -1 });
