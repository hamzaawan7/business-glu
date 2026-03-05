export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'member';
    tenant_id?: string | null;
}

export type ActiveView = 'admin' | 'user';

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    activeView: ActiveView;
    canSwitchView: boolean;
};
