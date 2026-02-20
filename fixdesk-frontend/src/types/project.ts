export interface CustomStatus {
    code: string;
    name: string;
    color: string;
    readonly?: boolean;
}

export interface CustomPriority {
    code: string;
    name: string;
    color: string;
}

export interface Project {
    id: number;
    uuid: string;
    name: string;
    description: string;
    icon_url: string;
    created_by: number;
    workspace_id?: number;
    workspace_uuid?: string;
    created_at: string;
    custom_statuses?: CustomStatus[];
    custom_priorities?: CustomPriority[];
}

export interface BugList {
    id: number;
    uuid: string;
    project_id: number;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_by: number;
    assigned_to?: number;
    created_at: string;
    updated_at: string;
    creator_first_name: string;
    creator_last_name: string;
    assignee_first_name?: string;
    assignee_last_name?: string;
    attachments?: BugAttachment[];
    comments?: BugComment[];
}

export interface BugAttachment {
    id: number;
    type: 'file' | 'link';
    name: string;
    url: string;
    file_size?: number;
    mime_type?: string;
    created_at: string;
    first_name: string;
    last_name: string;
}

export interface BugComment {
    id: number;
    bug_id: number;
    user_id: number;
    comment: string;
    attachment_url?: string;
    parent_id?: number | null;
    created_at: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    replies?: BugComment[];
}

export interface ProjectMember {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    position?: string;
    avatar_url?: string;
    joined_at: string;
    is_creator: boolean;
}

export interface FormData {
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigned_to: string;
}

export interface NewLinkForm {
    name: string;
    url: string;
}

export interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
} 