import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type TestWorkspaceRole = 'ADMIN' | 'MEMBER';

const WORKSPACE_ROLE = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

type TestUser = {
  email: string;
  accessToken: string;
};

describe('T015 Permission QA RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const password = 'Password123!';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET ||= 'test-access-secret';
    process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN ||= '15m';
    process.env.JWT_REFRESH_EXPIRES_IN ||= '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  async function resetDatabase() {
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.workspaceInvitation.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.authSession.deleteMany();
    await prisma.user.deleteMany();
  }

  async function createUser(label: string): Promise<TestUser> {
    const unique = `${label}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const email = `t015-${unique}@example.com`;

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        fullName: `T015 ${label}`,
        password,
      })
      .expect(201);

    return {
      email,
      accessToken: response.body.data.accessToken,
    };
  }

  function auth(user: TestUser) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
    };
  }

  async function createWorkspace(owner: TestUser) {
    const response = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set(auth(owner))
      .send({
        name: 'T015 Workspace',
        description: 'Workspace for RBAC QA',
      })
      .expect(201);

    return response.body.data.workspace;
  }

  async function addWorkspaceMember(
    owner: TestUser,
    workspaceId: string,
    member: TestUser,
    role: TestWorkspaceRole = WORKSPACE_ROLE.MEMBER,
  ) {
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/members`)
      .set(auth(owner))
      .send({
        email: member.email,
        role,
      })
      .expect(201);

    return response.body.data.member;
  }

  async function createProject(
    actor: TestUser,
    workspaceId: string,
    name: string,
  ) {
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set(auth(actor))
      .send({
        name,
        description: `${name} description`,
      })
      .expect(201);

    return response.body.data.project;
  }

  async function addProjectMember(
    actor: TestUser,
    workspaceId: string,
    projectId: string,
    member: TestUser,
  ) {
    const response = await request(app.getHttpServer())
      .post(`/api/workspaces/${workspaceId}/projects/${projectId}/members`)
      .set(auth(actor))
      .send({
        email: member.email,
      })
      .expect(201);

    return response.body.data.member;
  }

  it('OWNER can create, update, archive, and manage members', async () => {
    const owner = await createUser('owner');
    const member = await createUser('member');
    const workspace = await createWorkspace(owner);

    await addWorkspaceMember(owner, workspace.id, member);

    const project = await createProject(owner, workspace.id, 'Owner Project');

    await addProjectMember(owner, workspace.id, project.id, member);

    await request(app.getHttpServer())
      .patch(`/api/workspaces/${workspace.id}/projects/${project.id}`)
      .set(auth(owner))
      .send({
        name: 'Owner Project Updated',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.project.name).toBe('Owner Project Updated');
      });

    await request(app.getHttpServer())
      .delete(`/api/workspaces/${workspace.id}/projects/${project.id}`)
      .set(auth(owner))
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.project.status).toBe('ARCHIVED');
      });
  });

  it('ADMIN can create project and manage workspace member APIs', async () => {
    const owner = await createUser('owner');
    const admin = await createUser('admin');
    const member = await createUser('member');

    const workspace = await createWorkspace(owner);

    await addWorkspaceMember(owner, workspace.id, admin, WORKSPACE_ROLE.ADMIN);

    await request(app.getHttpServer())
      .post(`/api/workspaces/${workspace.id}/members`)
      .set(auth(admin))
      .send({
        email: member.email,
        role: WORKSPACE_ROLE.MEMBER,
      })
      .expect(201);

    await createProject(admin, workspace.id, 'Admin Project');
  });

  it('MEMBER cannot create, update, archive, or manage workspace members', async () => {
    const owner = await createUser('owner');
    const member = await createUser('member');

    const workspace = await createWorkspace(owner);
    const project = await createProject(
      owner,
      workspace.id,
      'Protected Project',
    );

    await addWorkspaceMember(owner, workspace.id, member);

    await request(app.getHttpServer())
      .post(`/api/workspaces/${workspace.id}/projects`)
      .set(auth(member))
      .send({
        name: 'Forbidden Project',
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/workspaces/${workspace.id}/projects/${project.id}`)
      .set(auth(member))
      .send({
        name: 'Should Not Update',
      })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/workspaces/${workspace.id}/projects/${project.id}`)
      .set(auth(member))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/workspaces/${workspace.id}/members`)
      .set(auth(member))
      .send({
        email: owner.email,
        role: WORKSPACE_ROLE.MEMBER,
      })
      .expect(403);
  });

  it('MEMBER only sees projects where they are project member', async () => {
    const owner = await createUser('owner');
    const member = await createUser('member');

    const workspace = await createWorkspace(owner);

    await addWorkspaceMember(owner, workspace.id, member);

    const visibleProject = await createProject(
      owner,
      workspace.id,
      'Visible Project',
    );
    const hiddenProject = await createProject(
      owner,
      workspace.id,
      'Hidden Secret Project',
    );

    await addProjectMember(owner, workspace.id, visibleProject.id, member);

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspace.id}/projects`)
      .set(auth(member))
      .expect(200)
      .expect(({ body }) => {
        const projects = body.data.projects;

        expect(projects).toHaveLength(1);
        expect(projects[0].id).toBe(visibleProject.id);

        const serializedBody = JSON.stringify(body);

        expect(serializedBody).toContain('Visible Project');
        expect(serializedBody).not.toContain('Hidden Secret Project');
        expect(serializedBody).not.toContain(hiddenProject.id);
      });

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspace.id}/projects/${hiddenProject.id}`)
      .set(auth(member))
      .expect(404)
      .expect(({ body }) => {
        const serializedBody = JSON.stringify(body);

        expect(serializedBody).not.toContain('Hidden Secret Project');
      });
  });

  it('outsider cannot access workspace, project, or member APIs', async () => {
    const owner = await createUser('owner');
    const outsider = await createUser('outsider');

    const workspace = await createWorkspace(owner);
    const project = await createProject(owner, workspace.id, 'Private Project');

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspace.id}`)
      .set(auth(outsider))
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspace.id}/members`)
      .set(auth(outsider))
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspace.id}/projects`)
      .set(auth(outsider))
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/workspaces/${workspace.id}/projects/${project.id}`)
      .set(auth(outsider))
      .expect(403)
      .expect(({ body }) => {
        const serializedBody = JSON.stringify(body);

        expect(serializedBody).not.toContain('Private Project');
      });
  });
});
