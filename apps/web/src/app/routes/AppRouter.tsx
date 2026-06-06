import { Navigate, createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { ROUTE_PATHS } from "@/app/routes/route-paths";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ChatPage } from "@/features/chat/pages/ChatPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MembersPage } from "@/features/members/pages/MembersPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { TasksPage } from "@/features/tasks/pages/TasksPage";
import { WorkspacesPage } from "@/features/workspaces/pages/WorkspacesPage";

export const appRouter = createBrowserRouter([
  {
    path: ROUTE_PATHS.ROOT,
    element: <Navigate to={ROUTE_PATHS.DASHBOARD} replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTE_PATHS.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTE_PATHS.REGISTER,
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: ROUTE_PATHS.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTE_PATHS.WORKSPACES,
        element: <WorkspacesPage />,
      },
      {
        path: ROUTE_PATHS.PROJECTS,
        element: <ProjectsPage />,
      },
      {
        path: ROUTE_PATHS.MEMBERS,
        element: <MembersPage />,
      },
      {
        path: ROUTE_PATHS.TASKS,
        element: <TasksPage />,
      },
      {
        path: ROUTE_PATHS.NOTIFICATIONS,
        element: <NotificationsPage />,
      },
      {
        path: ROUTE_PATHS.CHAT,
        element: <ChatPage />,
      },
      {
        path: ROUTE_PATHS.REPORTS,
        element: <ReportsPage />,
      },
      {
        path: ROUTE_PATHS.SETTINGS,
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={ROUTE_PATHS.DASHBOARD} replace />,
  },
]);
