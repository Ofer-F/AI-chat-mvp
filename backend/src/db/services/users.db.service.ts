import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import type { UserDocument } from '../schemas/user.schema';

export interface CreateUserData {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export type PublicUserRow = Pick<User, '_id' | 'name' | 'email' | 'createdAt'>;

@Injectable()
export class UsersDbService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalized = email.trim().toLowerCase();
    return this.userModel.findOne({ email: normalized }).exec();
  }

  async create(data: CreateUserData): Promise<UserDocument> {
    return this.userModel.create({
      _id: data.id,
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      passwordHash: data.passwordHash,
      createdAt: new Date(),
    });
  }

  async findAll(): Promise<PublicUserRow[]> {
    return this.userModel
      .find()
      .select('-passwordHash')
      .sort({ createdAt: 1 })
      .lean<PublicUserRow[]>()
      .exec();
  }
}
