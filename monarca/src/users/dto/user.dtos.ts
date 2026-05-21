/**
 * File: user.dtos.ts
 * Description: Data Transfer Objects (DTOs) for user creation, updating, and presentation.
 */
import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

/**
 * DTO for creating a new user in the system.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'juan@gmail.com' })
  email: string;

  @ApiProperty({ example: 'Juan' })
  name: string;

  @ApiProperty({ example: 'López' })
  lastName: string;

  @ApiProperty({ example: '123456' })
  password: string;

  @ApiProperty({ example: 'active' })
  availabilityStatus: string;

  @ApiProperty({ example: 1 })
  idDepartment?: string;

  @ApiProperty({ example: 2 })
  idRole: string;

  @ApiProperty()
  idTravelAgency?: string;

  @ApiProperty({ example: 'Emp001', required: false })
  employeeNumber?: string;

  @ApiProperty({ example: '5781a1d8-f9f7-4561-b2ed-f6117877459f', required: false, nullable: true })
  idManager?: string | null;
}

/**
 * DTO for updating an existing user's details.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}

/**
 * DTO for user data output, omitting sensitive fields like passwords.
 */
export class UserDto extends OmitType(User, ['password']) {}

/*
Modification History:
- 2026-02-26 | Juan de Dios Gastélum | Applied coding standards.
*/
