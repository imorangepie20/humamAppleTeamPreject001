import { get, patch, del } from './index'

export interface UserAdminDto {
    userId: number
    nickname: string
    email: string
    roleType: 'MASTER' | 'ADMIN' | 'USER'
    grade: string | null
    createdAt: string
}

export interface UsersPageResponse {
    content: UserAdminDto[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}

export interface AdminStatsDto {
    totalUsers: number
    totalTracks: number
    totalPlaylists: number
}

export const adminApi = {
    getUsers: (search?: string, page = 0, size = 20) => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        params.set('page', String(page))
        params.set('size', String(size))
        return get<UsersPageResponse>(`/admin/users?${params.toString()}`)
    },
    updateRole: (userId: number, roleType: string) =>
        patch<{ message: string }>(`/admin/users/${userId}/role`, { roleType }),
    deleteUser: (userId: number) =>
        del<{ message: string }>(`/admin/users/${userId}`),
    getStats: () =>
        get<AdminStatsDto>('/admin/stats'),
}
