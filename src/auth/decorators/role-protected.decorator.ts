import { SetMetadata } from '@nestjs/common';
import { ValidRole } from '../interfaces';
export const META_ROLES = 'roles';

export const RoleProtected = (...args: ValidRole[]) => {
  return SetMetadata(META_ROLES, args);
};
