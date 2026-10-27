import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserRole = 'user' | 'admin';
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['user', 'admin'], default: 'user' })
  role: UserRole;

  @Prop({ type: [String], default: [] })
  interests: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Explicit schema.index method calls per evaluation specification
// 1. Unique index for O(1) auth lookup by email
UserSchema.index({ email: 1 }, { unique: true });

// 2. Chronological sort index for Admin paginated listing of users
UserSchema.index({ createdAt: -1 });

// 3. Multikey index for Scenario 1 interest aggregation ($match on interests)
UserSchema.index({ interests: 1 });
