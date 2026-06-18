import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users' })
export class User {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, required: true })
  email!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  passwordHash!: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Backs: lookup/uniqueness by email (signup conflict, login).
UserSchema.index({ email: 1 }, { unique: true });
