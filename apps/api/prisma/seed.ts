import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    }
  }
}
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ConversationType,
  MessageType,
  NotificationType,
  PrismaClient,
  ProjectStatus,
  ReminderStatus,
  TaskPriority,
  TaskStatus,
  UserStatus,
  WorkspaceInvitationStatus,
  WorkspaceRole,
} from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number, hoursOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursOffset);
  return d;
}

async function main() {
  console.log('Seeding TaskMinder Workspace demo data...');
  const passwordHash = await bcrypt.hash('TaskMinder@2026', 12);

  // 1. Demo Users
  const userSeeds = [
    {
      email: 'owner@taskminder.dev',
      fullName: 'Trương Anh Kiệt',
    },
    {
      email: 'admin@taskminder.dev',
      fullName: 'Nguyễn Minh Anh',
    },
    {
      email: 'dev1@taskminder.dev',
      fullName: 'Lê Hoàng Nam',
    },
    {
      email: 'dev2@taskminder.dev',
      fullName: 'Trần Thảo Vy',
    },
    {
      email: 'qa@taskminder.dev',
      fullName: 'Phạm Quốc Bảo',
    },
  ];

  const usersByEmail = new Map<string, { id: string; fullName: string; email: string }>();

  for (const item of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { fullName: item.fullName, status: UserStatus.ACTIVE },
      create: {
        email: item.email,
        fullName: item.fullName,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, fullName: true, email: true },
    });

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        taskUpdatesEnabled: true,
        remindersEnabled: true,
        chatEnabled: true,
        emailEnabled: false,
      },
    });

    usersByEmail.set(item.email, user);
  }

  const owner = usersByEmail.get('owner@taskminder.dev')!;
  const admin = usersByEmail.get('admin@taskminder.dev')!;
  const dev1 = usersByEmail.get('dev1@taskminder.dev')!;
  const dev2 = usersByEmail.get('dev2@taskminder.dev')!;
  const qa = usersByEmail.get('qa@taskminder.dev')!;

  // 2. Workspaces
  async function ensureWorkspace(name: string, description: string, ownerId: string) {
    const existing = await prisma.workspace.findFirst({
      where: { name, ownerId },
    });
    if (existing) return existing;

    return prisma.workspace.create({
      data: { name, description, ownerId },
    });
  }

  const wsCore = await ensureWorkspace(
    'TaskMinder Core Engineering',
    'Không gian phát triển sản phẩm TaskMinder Platform v2.0, API RBAC và hệ thống Realtime Chat.',
    owner.id,
  );

  const wsPortfolio = await ensureWorkspace(
    'FIT_CV2026 Portfolio Studio',
    'Quản lý tiến độ hoàn thiện sản phẩm, kiểm thử và thiết kế CV dự thi FIT_CV2026.',
    owner.id,
  );

  // Workspace Memberships
  const wsCoreMembers: Array<{ userId: string; role: WorkspaceRole }> = [
    { userId: owner.id, role: WorkspaceRole.OWNER },
    { userId: admin.id, role: WorkspaceRole.ADMIN },
    { userId: dev1.id, role: WorkspaceRole.MEMBER },
    { userId: dev2.id, role: WorkspaceRole.MEMBER },
    { userId: qa.id, role: WorkspaceRole.MEMBER },
  ];

  for (const m of wsCoreMembers) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: wsCore.id, userId: m.userId } },
      update: { role: m.role },
      create: { workspaceId: wsCore.id, userId: m.userId, role: m.role },
    });
  }

  const wsPortfolioMembers: Array<{ userId: string; role: WorkspaceRole }> = [
    { userId: owner.id, role: WorkspaceRole.OWNER },
    { userId: admin.id, role: WorkspaceRole.ADMIN },
    { userId: dev2.id, role: WorkspaceRole.MEMBER },
  ];

  for (const m of wsPortfolioMembers) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: wsPortfolio.id, userId: m.userId },
      },
      update: { role: m.role },
      create: { workspaceId: wsPortfolio.id, userId: m.userId, role: m.role },
    });
  }

  // 3. Projects
  async function ensureProject(
    workspaceId: string,
    name: string,
    description: string,
    status: ProjectStatus,
    memberIds: string[],
  ) {
    let project = await prisma.project.findFirst({
      where: { workspaceId, name },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          workspaceId,
          name,
          description,
          status,
          createdById: owner.id,
        },
      });
    }

    for (const userId of memberIds) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId } },
        update: {},
        create: { projectId: project.id, userId },
      });
    }

    return project;
  }

  const projPlatform = await ensureProject(
    wsCore.id,
    'TaskMinder Platform v2.0',
    'Core NestJS + React platform với RBAC, Kanban, Realtime Chat và Analytics.',
    ProjectStatus.ACTIVE,
    [owner.id, admin.id, dev1.id, dev2.id, qa.id],
  );

  const projMobile = await ensureProject(
    wsCore.id,
    'Mobile Companion & Push Sync',
    'Đồng bộ thông báo nhắc hạn deadline và tối ưu trải nghiệm responsive.',
    ProjectStatus.ACTIVE,
    [owner.id, admin.id, dev1.id, qa.id],
  );

  const projSecurity = await ensureProject(
    wsCore.id,
    'Security Audit & Rate Limiting',
    'Kiểm tra phân quyền RBAC, bảo mật JWT cookie và rate limit các endpoint nhạy cảm.',
    ProjectStatus.PLANNING,
    [owner.id, admin.id, qa.id],
  );

  const projDesign = await ensureProject(
    wsCore.id,
    'Design System & Dark Mode',
    'Hoàn thiện Tailwind v4 Dark Mode, Toast feedback và UI component tái sử dụng.',
    ProjectStatus.COMPLETED,
    [owner.id, dev2.id],
  );

  const projCv = await ensureProject(
    wsPortfolio.id,
    'CV Showcase & Deployment Pipeline',
    'Chuẩn hóa README, dữ liệu demo và triển khai dự án cho hồ sơ FIT_CV2026.',
    ProjectStatus.ACTIVE,
    [owner.id, admin.id, dev2.id],
  );

  // 4. Tasks
  const taskSeeds = [
    {
      projectId: projPlatform.id,
      title: 'Thiết kế kiến trúc RBAC đa Workspace & Project',
      description: 'Định nghĩa PermissionService và WorkspaceAccessService cho OWNER/ADMIN/MEMBER.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      assigneeId: owner.id,
      dueDate: daysFromNow(-2),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(4),
    },
    {
      projectId: projPlatform.id,
      title: 'Xây dựng Kanban Board kéo thả & lọc nâng cao',
      description: 'Hỗ trợ lọc theo trạng thái, độ ưu tiên, người phụ trách và optimistic UI.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      assigneeId: dev2.id,
      dueDate: daysFromNow(-1),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      projectId: projPlatform.id,
      title: 'Tích hợp Socket.IO Realtime Chat & Multi-tab Presence',
      description: 'Kênh #general, kênh dự án, DM 1-1 và trạng thái typing/online.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      createdById: owner.id,
      assigneeId: dev1.id,
      dueDate: daysFromNow(0),
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      projectId: projPlatform.id,
      title: 'Bổ sung Global Search Ctrl+K toàn Workspace',
      description: 'Tìm kiếm xuyên suốt Project, Task, Comment, Tin nhắn và Thành viên.',
      status: TaskStatus.REVIEW,
      priority: TaskPriority.HIGH,
      createdById: admin.id,
      assigneeId: dev1.id,
      dueDate: daysFromNow(2),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
    {
      projectId: projPlatform.id,
      title: 'Xuất báo cáo tiến độ CSV chuẩn UTF-8 BOM',
      description: 'Chống CSV formula injection và hiển thị bảng workload thành viên.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      createdById: admin.id,
      assigneeId: owner.id,
      dueDate: daysFromNow(3),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
    },
    {
      projectId: projPlatform.id,
      title: 'Viết E2E test cho luồng nhận lời mời Workspace',
      description: 'Kiểm tra redirect login và banner Lời mời gửi đến tôi.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      createdById: admin.id,
      assigneeId: qa.id,
      dueDate: daysFromNow(5),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      projectId: projPlatform.id,
      title: 'Tối ưu Docker Compose & PostgreSQL connection pool',
      description: 'Đảm bảo PrismaPg adapter hoạt động ổn định khi chạy concurrent requests.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      createdById: owner.id,
      assigneeId: null,
      dueDate: daysFromNow(6),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      projectId: projMobile.id,
      title: 'Kiểm thử responsive trên màn hình mobile 375px',
      description: 'Rà soát Kanban board, Chat 2 cột và Notification dropdown trên điện thoại.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      createdById: admin.id,
      assigneeId: dev2.id,
      dueDate: daysFromNow(-2), // Overdue
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
    },
    {
      projectId: projMobile.id,
      title: 'Cài đặt Reminders Scheduler quét nhắc hạn mỗi 60s',
      description: 'Tạo dedupeKey chống trùng thông báo khi nhắc deadline.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      assigneeId: dev1.id,
      dueDate: daysFromNow(-1),
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
    {
      projectId: projMobile.id,
      title: 'Bổ sung chế độ Không làm phiền (DND) & Quiet Hours',
      description: 'Cho phép thành viên tắt thông báo theo khung giờ ban đêm.',
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      createdById: admin.id,
      assigneeId: dev1.id,
      dueDate: daysFromNow(2),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(0),
    },
    {
      projectId: projMobile.id,
      title: 'Kiểm tra upload file đính kèm trên Safari & Chrome',
      description: 'Xác minh giới hạn 10MB và tải xuống StreamableFile có xác thực.',
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.MEDIUM,
      createdById: qa.id,
      assigneeId: qa.id,
      dueDate: daysFromNow(4),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      projectId: projSecurity.id,
      title: 'Áp dụng RateLimitGuard cho Auth và Workspace Invitations',
      description: 'Giới hạn request brute-force login, register và spam lời mời.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      createdById: owner.id,
      assigneeId: owner.id,
      dueDate: daysFromNow(-1), // Overdue
      createdAt: daysAgo(4),
      updatedAt: daysAgo(0),
    },
    {
      projectId: projSecurity.id,
      title: 'Bổ sung Security HTTP Headers (X-Frame-Options, nosniff)',
      description: 'Cấu hình CORS_ORIGIN linh hoạt theo môi trường và loại bỏ X-Powered-By.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      assigneeId: owner.id,
      dueDate: daysFromNow(1),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
    },
    {
      projectId: projSecurity.id,
      title: 'Rà soát kiểm thử phân quyền Task Assign & Delete',
      description: 'Đảm bảo MEMBER không thể assign task cho người khác nếu thiếu TASK_ASSIGN.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      createdById: admin.id,
      assigneeId: qa.id,
      dueDate: daysFromNow(4),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      projectId: projDesign.id,
      title: 'Triển khai Light / Dark Mode với Tailwind v4',
      description: 'Lưu theme vào localStorage và đồng bộ nút chuyển nhanh trên Header.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      assigneeId: dev2.id,
      dueDate: daysFromNow(-3),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(5),
    },
    {
      projectId: projDesign.id,
      title: 'Xây dựng hệ thống Global Toast ~2s cho mọi thao tác',
      description: 'Hiển thị phản hồi tức thì khi đăng nhập, tạo project, task, chat và xuất CSV.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      createdById: owner.id,
      assigneeId: dev2.id,
      dueDate: daysFromNow(-2),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      projectId: projCv.id,
      title: 'Hoàn thiện README.md chuẩn Portfolio & Kiến trúc Mermaid',
      description: 'Tài liệu hóa đầy đủ tech stack, RBAC matrix, database schema và hướng dẫn chạy.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      createdById: owner.id,
      assigneeId: owner.id,
      dueDate: daysFromNow(1),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
    },
    {
      projectId: projCv.id,
      title: 'Nạp dữ liệu mẫu & đồng bộ nhánh dev lên main',
      description: 'Đảm bảo repo GitHub trên CV QR code hiển thị đầy đủ mã nguồn hoàn chỉnh.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      assigneeId: admin.id,
      dueDate: daysFromNow(2),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(0),
    },
  ];

  const createdTasks: Array<{ id: string; title: string; projectId: string }> = [];

  for (const t of taskSeeds) {
    let task = await prisma.task.findFirst({
      where: { projectId: t.projectId, title: t.title },
      select: { id: true, title: true, projectId: true },
    });

    if (!task) {
      task = await prisma.task.create({
        data: t,
        select: { id: true, title: true, projectId: true },
      });

      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: t.createdById,
          action: 'TASK_CREATED',
          newValue: { title: t.title, status: t.status, priority: t.priority },
        },
      });
    }

    createdTasks.push(task);
  }

  // 5. Task Comments & Reminders
  const searchTask = createdTasks[3];
  if (searchTask) {
    const existingComment = await prisma.taskComment.findFirst({
      where: { taskId: searchTask.id, authorId: admin.id },
    });
    if (!existingComment) {
      await prisma.taskComment.createMany({
        data: [
          {
            taskId: searchTask.id,
            authorId: admin.id,
            content:
              '@Lê Hoàng Nam kiểm tra lại phần lọc tin nhắn DIRECT trong Global Search để đảm bảo không lộ DM của người khác nhé.',
          },
          {
            taskId: searchTask.id,
            authorId: dev1.id,
            content:
              'Đã kiểm tra RBAC filter theo conversation.members, unit test pass 100% rồi ạ!',
          },
        ],
      });
    }

    const existingReminder = await prisma.taskReminder.findFirst({
      where: { taskId: searchTask.id, userId: dev1.id },
    });
    if (!existingReminder) {
      await prisma.taskReminder.create({
        data: {
          taskId: searchTask.id,
          userId: dev1.id,
          remindAt: daysFromNow(1),
          status: ReminderStatus.PENDING,
        },
      });
    }
  }

  // 6. Pending Workspace Invitations
  const invSeeds = [
    {
      workspaceId: wsCore.id,
      email: 'newbie@taskminder.dev',
      role: WorkspaceRole.MEMBER,
      invitedById: owner.id,
    },
    {
      workspaceId: wsPortfolio.id,
      email: qa.email,
      role: WorkspaceRole.MEMBER,
      invitedById: owner.id,
    },
  ];

  for (const inv of invSeeds) {
    const existing = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: inv.workspaceId,
        email: inv.email,
        status: WorkspaceInvitationStatus.PENDING,
      },
    });
    if (!existing) {
      await prisma.workspaceInvitation.create({
        data: {
          workspaceId: inv.workspaceId,
          email: inv.email,
          role: inv.role,
          token: randomUUID().replace(/-/g, ''),
          invitedById: inv.invitedById,
          expiresAt: daysFromNow(7),
        },
      });
    }
  }

  // 7. Notifications
  const notifSeeds = [
    {
      userId: owner.id,
      type: NotificationType.TASK_UPDATED,
      title: 'Task moved to REVIEW',
      message: '"Bổ sung Global Search Ctrl+K toàn Workspace" moved to REVIEW',
      dedupeKey: 'seed-notif-owner-1',
      isRead: false,
      metadata: { workspaceId: wsCore.id, projectId: projPlatform.id },
    },
    {
      userId: owner.id,
      type: NotificationType.TASK_DUE_SOON,
      title: 'Deadline sắp tới hạn',
      message: 'Công việc "Hoàn thiện README.md chuẩn Portfolio & Kiến trúc Mermaid" sắp đến hạn.',
      dedupeKey: 'seed-notif-owner-2',
      isRead: false,
      metadata: { workspaceId: wsPortfolio.id, projectId: projCv.id },
    },
    {
      userId: dev1.id,
      type: NotificationType.MENTION,
      title: 'Nguyễn Minh Anh đã nhắc đến bạn',
      message: 'Kiểm tra lại phần lọc tin nhắn DIRECT trong Global Search.',
      dedupeKey: 'seed-notif-dev1-1',
      isRead: false,
      metadata: { workspaceId: wsCore.id, projectId: projPlatform.id },
    },
    {
      userId: qa.id,
      type: NotificationType.WORKSPACE_INVITATION,
      title: 'Workspace invitation',
      message: 'You were invited to join FIT_CV2026 Portfolio Studio as MEMBER',
      dedupeKey: 'seed-notif-qa-1',
      isRead: false,
      metadata: { workspaceId: wsPortfolio.id },
    },
  ];

  for (const n of notifSeeds) {
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId: n.userId, dedupeKey: n.dedupeKey } },
      update: {},
      create: n,
    });
  }

  // 8. Conversations & Messages
  let generalConv = await prisma.conversation.findFirst({
    where: { workspaceId: wsCore.id, type: ConversationType.WORKSPACE },
  });
  if (!generalConv) {
    generalConv = await prisma.conversation.create({
      data: {
        workspaceId: wsCore.id,
        type: ConversationType.WORKSPACE,
        name: 'general',
        createdById: owner.id,
        lastMessageAt: new Date(),
      },
    });
  }

  for (const m of wsCoreMembers) {
    await prisma.conversationMember.upsert({
      where: {
        conversationId_userId: { conversationId: generalConv.id, userId: m.userId },
      },
      update: {},
      create: { conversationId: generalConv.id, userId: m.userId },
    });
  }

  const existingGeneralMsg = await prisma.message.findFirst({
    where: { conversationId: generalConv.id },
  });
  if (!existingGeneralMsg) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: generalConv.id,
          senderId: owner.id,
          type: MessageType.TEXT,
          content: 'Chào cả team! Chúng ta đã hoàn thành Sprint 5 và đang bước vào Sprint 6 chốt hạ.',
          createdAt: daysAgo(0, 3),
        },
        {
          conversationId: generalConv.id,
          senderId: admin.id,
          type: MessageType.TEXT,
          content: 'Mọi người nhớ kiểm tra mục Reports và Xuất CSV để đối chiếu số liệu tuần này nhé.',
          createdAt: daysAgo(0, 2),
        },
        {
          conversationId: generalConv.id,
          senderId: dev1.id,
          type: MessageType.TEXT,
          content: 'Realtime Chat và Presence chạy mượt rồi ạ, đổi trạng thái là tab kia cập nhật ngay!',
          createdAt: daysAgo(0, 1),
        },
      ],
    });
  }

  // Project Channel for projPlatform
  const projConv = await prisma.conversation.upsert({
    where: { projectId: projPlatform.id },
    update: {},
    create: {
      workspaceId: wsCore.id,
      projectId: projPlatform.id,
      type: ConversationType.PROJECT,
      name: projPlatform.name,
      createdById: owner.id,
      lastMessageAt: new Date(),
    },
  });

  for (const m of wsCoreMembers) {
    await prisma.conversationMember.upsert({
      where: {
        conversationId_userId: { conversationId: projConv.id, userId: m.userId },
      },
      update: {},
      create: { conversationId: projConv.id, userId: m.userId },
    });
  }

  const existingProjMsg = await prisma.message.findFirst({
    where: { conversationId: projConv.id },
  });
  if (!existingProjMsg) {
    await prisma.message.create({
      data: {
        conversationId: projConv.id,
        senderId: dev2.id,
        type: MessageType.TEXT,
        content: 'Giao diện Dark Mode cho Task Board và Drawer đã hoàn thiện xong rồi mọi người ơi!',
      },
    });
  }

  // Direct Message: owner <-> admin
  const dmKey = `${wsCore.id}:${[owner.id, admin.id].sort().join(':')}`;
  const dmConv = await prisma.conversation.upsert({
    where: { directKey: dmKey },
    update: {},
    create: {
      workspaceId: wsCore.id,
      type: ConversationType.DIRECT,
      directKey: dmKey,
      createdById: owner.id,
      lastMessageAt: new Date(),
      members: {
        create: [{ userId: owner.id }, { userId: admin.id }],
      },
    },
  });

  const existingDmMsg = await prisma.message.findFirst({
    where: { conversationId: dmConv.id },
  });
  if (!existingDmMsg) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: dmConv.id,
          senderId: admin.id,
          type: MessageType.TEXT,
          content: 'Kiệt ơi, mình vừa duyệt xong PR cho Global Search Ctrl+K rồi nhé.',
          createdAt: daysAgo(0, 2),
        },
        {
          conversationId: dmConv.id,
          senderId: owner.id,
          type: MessageType.TEXT,
          content: 'Tuyệt vời Minh Anh, mình đang chạy seed data và chuẩn bị đồng bộ nhánh main!',
          createdAt: daysAgo(0, 1),
        },
      ],
    });
  }

  // 9. Workspace Activity Logs
  const existingLogsCount = await prisma.activityLog.count({
    where: { workspaceId: wsCore.id },
  });

  if (existingLogsCount === 0) {
    await prisma.activityLog.createMany({
      data: [
        {
          workspaceId: wsCore.id,
          actorId: owner.id,
          entityType: 'WORKSPACE',
          entityId: wsCore.id,
          action: 'WORKSPACE_CREATED',
          summary: `Tạo workspace "${wsCore.name}"`,
          createdAt: daysAgo(6),
        },
        {
          workspaceId: wsCore.id,
          actorId: owner.id,
          entityType: 'MEMBER',
          action: 'MEMBER_ADDED',
          summary: `Thêm ${admin.fullName} (ADMIN) vào workspace`,
          createdAt: daysAgo(6),
        },
        {
          workspaceId: wsCore.id,
          actorId: owner.id,
          entityType: 'PROJECT',
          entityId: projPlatform.id,
          action: 'PROJECT_CREATED',
          summary: `Tạo dự án "${projPlatform.name}"`,
          createdAt: daysAgo(5),
        },
        {
          workspaceId: wsCore.id,
          actorId: dev1.id,
          entityType: 'TASK',
          action: 'TASK_STATUS_CHANGED',
          summary: 'Chuyển trạng thái "Tích hợp Socket.IO Realtime Chat & Multi-tab Presence" sang DONE',
          createdAt: daysAgo(1),
        },
        {
          workspaceId: wsCore.id,
          actorId: admin.id,
          entityType: 'TASK',
          action: 'TASK_ASSIGNEE_CHANGED',
          summary: `Giao "Viết E2E test cho luồng nhận lời mời Workspace" cho ${qa.fullName}`,
          createdAt: daysAgo(1),
        },
        {
          workspaceId: wsCore.id,
          actorId: owner.id,
          entityType: 'INVITATION',
          action: 'INVITATION_SENT',
          summary: 'Gửi lời mời tham gia workspace tới newbie@taskminder.dev (MEMBER)',
          createdAt: daysAgo(0, 2),
        },
      ],
    });
  }

  console.log('\nSeed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Accounts (Password for all: TaskMinder@2026):');
  console.log('  - owner@taskminder.dev  (OWNER)');
  console.log('  - admin@taskminder.dev  (ADMIN)');
  console.log('  - dev1@taskminder.dev   (MEMBER)');
  console.log('  - dev2@taskminder.dev   (MEMBER)');
  console.log('  - qa@taskminder.dev     (MEMBER + has pending workspace invite!)');
  console.log('--------------------------------------------------\n');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
