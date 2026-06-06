/**
 * File: hierarchy-resolver.service.ts
 * Description: Traverses the manager chain of a user upward (idManager links)
 * to resolve approvers for hierarchy-based approval steps.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

const MAX_HIERARCHY_DEPTH = 10;

export interface ResolvedManager {
  level: number;
  userId: string;
  name: string;
  lastName: string;
  email: string;
}

@Injectable()
export class HierarchyResolverService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Climbs the manager chain upward from the given user, up to `levels` deep.
   * Stops early if the chain ends (idManager is null), a cycle is detected,
   * or a manager does not hold the required role (when requiredRoleId is provided).
   * @param userId Starting user (requester).
   * @param levels Max number of levels to climb.
   * @param requiredRoleId When provided, the chain stops at the first manager
   *                       whose role does not match this ID.
   * @returns Array of resolved managers ordered from closest (level 1) to furthest.
   */
  async resolveManagerChain(
    userId: string,
    levels: number,
    requiredRoleId?: string,
  ): Promise<ResolvedManager[]> {
    const depth = Math.min(levels, MAX_HIERARCHY_DEPTH);
    const chain: ResolvedManager[] = [];
    const visited = new Set<string>([userId]);
    let currentId = userId;

    for (let i = 1; i <= depth; i++) {
      const user = await this.userRepository.findOne({
        where: { id: currentId },
        select: ['id', 'idManager'],
      });

      if (!user || !user.idManager) break;
      if (visited.has(user.idManager)) break;

      visited.add(user.idManager);

      const manager = await this.userRepository.findOne({
        where: { id: user.idManager },
        select: ['id', 'name', 'lastName', 'email', 'idRole'],
      });

      if (!manager) break;

      if (requiredRoleId && manager.idRole !== requiredRoleId) break;

      chain.push({
        level: i,
        userId: manager.id,
        name: manager.name,
        lastName: manager.lastName,
        email: manager.email ?? '',
      });

      currentId = manager.id;
    }

    return chain;
  }

  /**
   * Returns the manager at exactly N levels above the given user, or null if unreachable.
   * @param userId Starting user.
   * @param level Exact hierarchy level (1 = direct manager, 2 = manager's manager, etc.).
   */
  async getManagerAtLevel(
    userId: string,
    level: number,
  ): Promise<string | null> {
    const chain = await this.resolveManagerChain(userId, level);
    const entry = chain.find((m) => m.level === level);
    return entry ? entry.userId : null;
  }
}

/*
 * Modification History:
 * - 2026-05-12 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-06-06 | Juan de Dios Gastélum Flores | Added requiredRoleId parameter to resolveManagerChain. Chain stops when a manager does not hold the required role.
 */
