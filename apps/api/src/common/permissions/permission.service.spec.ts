import { WorkspaceRole } from '../../generated/prisma/client';
import { Permission } from './permission.enum';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  const service = new PermissionService();

  it('grants full workspace, project, and task permissions to OWNER', () => {
    expect(
      service.hasPermission(WorkspaceRole.OWNER, Permission.WORKSPACE_MANAGE),
    ).toBe(true);
    expect(
      service.hasPermission(
        WorkspaceRole.OWNER,
        Permission.WORKSPACE_MEMBER_MANAGE,
      ),
    ).toBe(true);
    expect(
      service.hasPermission(WorkspaceRole.OWNER, Permission.TASK_ASSIGN),
    ).toBe(true);
  });

  it('grants workspace, member, project, and task permissions to ADMIN', () => {
    expect(
      service.hasPermission(WorkspaceRole.ADMIN, Permission.WORKSPACE_MANAGE),
    ).toBe(true);
    expect(
      service.hasPermission(
        WorkspaceRole.ADMIN,
        Permission.WORKSPACE_MEMBER_MANAGE,
      ),
    ).toBe(true);
    expect(
      service.hasPermission(WorkspaceRole.ADMIN, Permission.PROJECT_CREATE),
    ).toBe(true);
    expect(
      service.hasPermission(WorkspaceRole.ADMIN, Permission.TASK_ASSIGN),
    ).toBe(true);
  });

  it('allows MEMBER to create/update tasks while denying admin/workspace management', () => {
    expect(
      service.hasPermission(WorkspaceRole.MEMBER, Permission.TASK_CREATE),
    ).toBe(true);
    expect(
      service.hasPermission(WorkspaceRole.MEMBER, Permission.TASK_UPDATE),
    ).toBe(true);
    expect(
      service.hasPermission(WorkspaceRole.MEMBER, Permission.TASK_ASSIGN),
    ).toBe(false);
    expect(
      service.hasPermission(WorkspaceRole.MEMBER, Permission.PROJECT_CREATE),
    ).toBe(false);
  });
});
