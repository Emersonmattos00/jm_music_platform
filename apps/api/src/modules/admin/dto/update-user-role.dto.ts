import { IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsIn(['CUSTOMER', 'ADMIN'])
  role!: 'CUSTOMER' | 'ADMIN';
}