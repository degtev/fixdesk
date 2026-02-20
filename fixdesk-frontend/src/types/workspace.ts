export interface Workspace {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
}

export interface WorkspaceWithStats extends Workspace {
    project_count: number;
    member_count: number;
    is_owner: boolean;
}

export interface WorkspaceMember {
    workspace_id: number;
    user_id: number;
    position?: string;
    first_name?: string;
    last_name?: string;
    joined_at: string;
    email: string;
    is_owner: boolean;
}

export interface WorkspaceInvitation {
    id: number;
    workspace_id: number;
    email: string;
    token: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    invited_by: number;
    created_at: string;
    expires_at: string;
}

export interface WorkspaceInvitationInfo {
    id: number;
    workspace_id: number;
    email: string;
    status: string;
    expires_at: string;
    workspace_name: string;
    workspace_description?: string;
    inviter_first_name: string;
    inviter_last_name: string;
}

export interface CreateWorkspaceDto {
    name: string;
    description?: string;
}

export interface UpdateWorkspaceDto {
    name: string;
    description?: string;
}

export interface InviteToWorkspaceDto {
    email: string;
}

export interface AcceptWorkspaceInviteDto {
    position?: string;
    first_name?: string;
    last_name?: string;
}

