import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '../../generated/prisma/client';

import { Permission } from './permission.enum';
import { ROLE_PERMISSIONS } from './role-permission.map';

@Injectable()
export class PermissionService {
  hasPermission(role: WorkspaceRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] ?? [];

    return permissions.includes(permission);
  }
}
