import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './entities/policy.entity';
import { PolicyRule } from './entities/policy-rule.entity';
import { Company } from 'src/companies/entity/company.entity';
import { Department } from 'src/departments/entity/department.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import {
  CreateRefundPolicyDto,
  CreateRefundPolicyRuleDto,
  UpdateRefundPolicyDto,
} from './dto/refund-policies.dtos';

type AccessContext =
  | { role: 'superadmin' }
  | { role: 'companyadmin'; companyId: string };

@Injectable()
export class RefundPoliciesService {
  private readonly superAdminRoleNames = [
    'superadmin',
    'super admin',
    'superadministrador',
    'super administrador',
  ];

  private readonly companyAdminRoleNames = [
    'companyadmin',
    'company admin',
    'administrador de empresa',
    'admin empresa',
  ];

  constructor(
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyRule)
    private readonly policyRuleRepo: Repository<PolicyRule>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,
  ) {}

  async findGroupedByCompany(
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<
    Array<{
      company: Pick<Company, 'id' | 'key' | 'name'>;
      policies: Policy[];
    }>
  > {
    const access = await this.resolveAccessContext(idRole, idDepartment);

    const policies = await this.policyRepo.find({
      where: access.role === 'companyadmin' ? { id_company: access.companyId } : {},
      relations: ['company', 'rules'],
      order: {
        name: 'ASC',
        rules: {
          expense_class: 'ASC',
        },
      },
    });

    const grouped = new Map<
      string,
      {
        company: Pick<Company, 'id' | 'key' | 'name'>;
        policies: Policy[];
      }
    >();

    for (const policy of policies) {
      if (!policy.company?.id) {
        continue;
      }

      const existingGroup = grouped.get(policy.company.id);
      if (!existingGroup) {
        grouped.set(policy.company.id, {
          company: {
            id: policy.company.id,
            key: policy.company.key,
            name: policy.company.name,
          },
          policies: [policy],
        });
        continue;
      }

      existingGroup.policies.push(policy);
    }

    return Array.from(grouped.values()).sort((left, right) =>
      left.company.name.localeCompare(right.company.name),
    );
  }

  async findOne(
    id: string,
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<Policy> {
    const access = await this.resolveAccessContext(idRole, idDepartment);
    const policy = await this.policyRepo.findOne({
      where: { id },
      relations: ['company', 'rules'],
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    this.assertPolicyAccess(policy, access);
    return policy;
  }

  async create(
    idRole: string,
    idDepartment: string | undefined,
    data: CreateRefundPolicyDto,
  ): Promise<Policy> {
    const access = await this.resolveAccessContext(idRole, idDepartment);

    const targetCompanyId =
      access.role === 'superadmin'
        ? this.resolveSuperAdminTargetCompanyId(data.id_company)
        : access.companyId;

    if (access.role === 'companyadmin' && data.id_company && data.id_company !== access.companyId) {
      throw new ForbiddenException('CompanyAdmin can only create policies for their own company.');
    }

    await this.assertCompanyExists(targetCompanyId);

    const savedPolicyId = await this.policyRepo.manager.transaction(async (manager) => {
      const createdPolicy = manager.create(Policy, {
        id_company: targetCompanyId,
        name: data.name.trim(),
        description: data.description?.trim(),
        is_active: data.is_active ?? true,
      });

      const savedPolicy = await manager.save(Policy, createdPolicy);

      if (data.rules?.length) {
        const rulesToInsert = data.rules.map((rule) =>
          manager.create(PolicyRule, this.mapRulePayload(savedPolicy.id, rule)),
        );
        await manager.save(PolicyRule, rulesToInsert);
      }

      return savedPolicy.id;
    });

    return this.findOne(savedPolicyId, idRole, idDepartment);
  }

  async update(
    id: string,
    idRole: string,
    idDepartment: string | undefined,
    data: UpdateRefundPolicyDto,
  ): Promise<Policy> {
    const access = await this.resolveAccessContext(idRole, idDepartment);

    const policy = await this.policyRepo.findOne({
      where: { id },
      relations: ['rules'],
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    this.assertPolicyAccess(policy, access);

    let targetCompanyId = policy.id_company;

    if (data.id_company) {
      if (access.role === 'companyadmin' && data.id_company !== access.companyId) {
        throw new ForbiddenException('CompanyAdmin cannot move policy to another company.');
      }

      targetCompanyId =
        access.role === 'superadmin' ? data.id_company : access.companyId;
      await this.assertCompanyExists(targetCompanyId);
    }

    await this.policyRepo.manager.transaction(async (manager) => {
      const updatePayload: {
        id_company: string;
        name?: string;
        description?: string;
        is_active?: boolean;
      } = {
        id_company: targetCompanyId,
      };

      if (data.name !== undefined) {
        updatePayload.name = data.name.trim();
      }

      if (data.description !== undefined) {
        updatePayload.description = data.description?.trim();
      }

      if (data.is_active !== undefined) {
        updatePayload.is_active = data.is_active;
      }

      await manager.update(Policy, id, updatePayload);

      if (data.rules !== undefined) {
        await manager.delete(PolicyRule, { id_policy: id });

        if (data.rules.length) {
          const rulesToInsert = data.rules.map((rule) =>
            manager.create(PolicyRule, this.mapRulePayload(id, rule)),
          );
          await manager.save(PolicyRule, rulesToInsert);
        }
      }
    });

    return this.findOne(id, idRole, idDepartment);
  }

  async remove(
    id: string,
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<{ status: boolean; message: string }> {
    const access = await this.resolveAccessContext(idRole, idDepartment);

    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    this.assertPolicyAccess(policy, access);

    await this.policyRepo.delete(id);
    return {
      status: true,
      message: `Policy ${id} removed`,
    };
  }

  private mapRulePayload(
    policyId: string,
    rule: CreateRefundPolicyRuleDto,
  ): Partial<PolicyRule> {
    return {
      id_policy: policyId,
      expense_class: rule.expense_class.trim(),
      operator: rule.operator.trim().toUpperCase(),
      threshold_value: rule.threshold_value ?? null,
      threshold_unit: rule.threshold_unit?.trim() ?? null,
      consequence: rule.consequence?.trim().toUpperCase() ?? 'POLICY_VIOLATION',
      is_active: rule.is_active ?? true,
    };
  }

  private resolveSuperAdminTargetCompanyId(companyId?: string): string {
    if (!companyId) {
      throw new BadRequestException('id_company is required for SuperAdmin operations.');
    }

    return companyId;
  }

  private assertPolicyAccess(policy: Policy, access: AccessContext): void {
    if (access.role === 'superadmin') {
      return;
    }

    if (policy.id_company !== access.companyId) {
      throw new ForbiddenException('CompanyAdmin can only access policies from their own company.');
    }
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }
  }

  private async resolveAccessContext(
    idRole: string,
    idDepartment: string | undefined,
  ): Promise<AccessContext> {
    const role = await this.roleRepo.findOne({ where: { id: idRole } });
    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    const normalizedRole = role.name.trim().toLowerCase();

    if (this.superAdminRoleNames.includes(normalizedRole)) {
      return { role: 'superadmin' };
    }

    if (this.companyAdminRoleNames.includes(normalizedRole)) {
      if (!idDepartment) {
        throw new ForbiddenException(
          'CompanyAdmin must belong to a department associated with a company.',
        );
      }

      const department = await this.departmentRepo.findOne({
        where: { id: idDepartment },
      });

      if (!department?.id_company) {
        throw new NotFoundException('Department company context not found.');
      }

      return {
        role: 'companyadmin',
        companyId: department.id_company,
      };
    }

    throw new ForbiddenException('Only SuperAdmin and CompanyAdmin can access refund policies.');
  }
}
