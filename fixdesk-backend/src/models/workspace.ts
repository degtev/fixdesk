export interface Workspace {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    owner_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface WorkspaceMember {
    workspace_id: number;
    user_id: number;
    position?: string;
    first_name?: string;
    last_name?: string;
    joined_at: Date;
}

export interface WorkspaceInvitation {
    id: number;
    workspace_id: number;
    email: string;
    token: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    invited_by: number;
    created_at: Date;
    expires_at: Date;
}

export interface WorkspaceWithStats extends Workspace {
    project_count: number;
    member_count: number;
    is_owner: boolean;
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
    email: string;
    first_name?: string;
    last_name?: string;
    position?: string;
}

