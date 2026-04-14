/**
 * File: user.checks.service.ts
 * Description: Service handling specific validation checks, authentication matching, and user assignments.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Not, Repository } from 'typeorm';
import { LogInDTO } from 'src/auth/dto/login.dto';
import * as bcrypt from 'bcrypt';
import { EffectivePermissionsService } from 'src/roles/effective-permissions.service';

@Injectable()
export class UserChecks {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly effectivePermissions: EffectivePermissionsService,
  ) {}

  /**
   * Validates user credentials during the login process.
   * @param data Data Transfer Object containing email and password.
   * @returns The user entity if validation succeeds, or null if it fails.
   */
  async logIn(data: LogInDTO): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      relations: [
        'department',
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (!user) {
      console.log('Email or password incorrect');
      return null;
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      console.log('Password does not match');
      return null;
    }

    return user;
  }

  /**
   * Retrieves specific basic fields of a user by their ID.
   * @param id The UUID of the user.
   * @returns The selected user entity or null if not found.
   */
  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      select: ['id', 'name', 'email', 'department', 'lastName', 'role'],
      relations: [
        'department',
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (!user) {
      console.log('User not found');
      return null;
    }

    if (user.role) {
      user.role.permissions =
        await this.effectivePermissions.getActivePermissionsForUser(user);
    }

    return user;
  }

  /**
   * Finds and returns a random user ID whose role is 'Aprobador'.
   * @returns A random approver's UUID or null if none exist.
   */
  async getRandomApproverId(): Promise<string | null> {
    const approvers = await this.userRepository.find({
      where: {
        role: {
          name: 'Aprobador',
        },
      },
      select: ['id'],
      relations: [],
    });

    if (approvers.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * approvers.length);

    return approvers[randomIndex].id;
  }

  /**
   * Finds and returns a random approver's ID from a specific department, excluding a specific user ID.
   * @param idDepartment The UUID of the department.
   * @param idUser The UUID of the user to exclude (to prevent assigning oneself).
   * @returns A random approver's UUID or null if none exist.
   */
  async getRandomApproverIdFromSameDepartment(idDepartment: string, idUser: string): Promise<string | null> {
    const approvers = await this.userRepository.find({
      where: {
        id: Not(idUser), 
        idDepartment: idDepartment, // Updated to camelCase
        role: {
          name: 'Aprobador',
        },
      },
      select: ['id'],
      relations: [],
    });

    if (approvers.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * approvers.length);

    return approvers[randomIndex].id;
  }

  /**
   * Finds and returns a random user ID whose role is 'SOI'.
   * @returns A random SOI's UUID or null if none exist.
   */
  async getRandomSoiId(): Promise<string | null> {
    const sois = await this.userRepository.find({
      where: {
        role: {
          name: 'SOI',
        },
      },
      select: ['id'],
      relations: [],
    });

    if (sois.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * sois.length);

    return sois[randomIndex].id;
  }
}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
- 2026-03-27 | Efren | Profile loads rolePermissions and exposes only non-expired permissions on role.permissions.
*/