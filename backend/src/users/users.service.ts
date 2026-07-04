import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { PublicUser } from '../common/types/chat';
import { toPublicUser } from './mappers/user.mapper';
import type { UserDocument } from './schemas/user.schema';
import { UsersDbService } from './users.db.service';

const BCRYPT_SALT_ROUNDS = 10;

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersDb: UsersDbService) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.usersDb.findById(id);
  }

  async existsById(id: string): Promise<boolean> {
    return (await this.usersDb.findById(id)) !== null;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersDb.findByEmail(email);
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const email = input.email.trim().toLowerCase();

    if (await this.usersDb.findByEmail(email)) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    return this.usersDb.create({
      id: `u-${randomUUID()}`,
      email,
      name: input.name.trim(),
      passwordHash,
    });
  }

  async listPublic(): Promise<PublicUser[]> {
    const rows = await this.usersDb.findAll();
    return rows.map((row) => toPublicUser(row));
  }
}
