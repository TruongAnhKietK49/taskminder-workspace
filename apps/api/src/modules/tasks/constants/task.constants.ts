export const TASK_TITLE_MAX_LENGTH = 160;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
export const TASK_COMMENT_MAX_LENGTH = 2000;
export const TASK_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
]);

export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set<string>([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.zip',
]);

export const TASK_ACTIVITY_ACTIONS = {
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ASSIGNEE_CHANGED: 'ASSIGNEE_CHANGED',
  TASK_ARCHIVED: 'TASK_ARCHIVED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  ATTACHMENT_UPLOADED: 'ATTACHMENT_UPLOADED',
  ATTACHMENT_DELETED: 'ATTACHMENT_DELETED',
} as const;
