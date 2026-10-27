import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Explicit schema.index method calls per evaluation specification
// 1. Compound index for Scenario 2 and retrieving posts of a specific user chronologically
PostSchema.index({ author: 1, createdAt: -1 });

// 2. Chronological sort index for public feed
PostSchema.index({ createdAt: -1 });
