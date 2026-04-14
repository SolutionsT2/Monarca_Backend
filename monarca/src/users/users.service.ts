/**
 * File: users.service.ts
 * Description: Service containing the business logic for user creation, retrieval, updating, and deletion.
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dtos';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  /**
   * Finds a user by ID, including their role and permissions.
   * @param id The UUID of the user.
   * @returns The user entity.
   */
  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }

  /**
   * Retrieves all registered users.
   * @returns An array of user data transfer objects.
   */
  async findAll(): Promise<UserDto[]> {
    return await this.repo.find();
  }

  /**
   * Creates a new user in the database.
   * @param data The user creation data.
   * @returns The newly created user entity.
   */
  async create(data: CreateUserDto): Promise<User> {
    const ent = this.repo.create(data);
    return this.repo.save(ent);
  }

  /**
   * Finds a single user by ID, including their travel agency relation.
   * @param id The UUID of the user.
   * @returns The user data transfer object.
   */
  async findOne(id: string): Promise<UserDto> {
    const ent = await this.repo.findOne({
      where: { id },
      relations: { travelAgency: true },
    });
    if (!ent) throw new NotFoundException(`User ${id} not found`);
    return ent;
  }

  /**
   * Updates a user's information.
   * @param id The UUID of the user to update.
   * @param data The data to update.
   * @returns The updated user data transfer object.
   */
  async update(id: string, data: UpdateUserDto): Promise<UserDto> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  /**
   * Deletes a user from the database.
   * @param id The UUID of the user to delete.
   * @returns An object containing the operation status and a confirmation message.
   */
  async delete(id: string): Promise<{ status: boolean; message: string }> {
    await this.repo.delete(id);
    return { status: true, message: `User ${id} deleted` };
  }
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
*/