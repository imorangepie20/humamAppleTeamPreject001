import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Shield, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { adminApi, UserAdminDto } from '../../services/api/admin';

const ROLES = ['MASTER', 'ADMIN', 'USER'] as const;

const UserManagement: React.FC = () => {
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<UserAdminDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // 현재 로그인 유저 역할 (JWT에서 파싱)
    const currentUserRole = (() => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return 'USER';
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role || 'USER';
        } catch { return 'USER'; }
    })();

    const fetchUsers = useCallback(async (search: string, p: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.getUsers(search, p, 20);
            setUsers(res.content);
            setTotalPages(res.totalPages);
            setTotalElements(res.totalElements);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : '사용자 목록을 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(searchTerm, page);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
            fetchUsers(value, 0);
        }, 400);
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await adminApi.updateRole(userId, newRole);
            setUsers(prev => prev.map(u =>
                u.userId === userId ? { ...u, roleType: newRole as UserAdminDto['roleType'] } : u
            ));
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : '역할 변경 실패');
        }
    };

    const handleDelete = async (userId: number) => {
        try {
            await adminApi.deleteUser(userId);
            setDeleteConfirm(null);
            fetchUsers(searchTerm, page);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : '삭제 실패');
        }
    };

    // Theme styles
    const tableHeaderStyle = theme === 'jazz'
        ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
        : theme === 'soul'
            ? 'bg-[#93C5FD]/10 text-[#93C5FD]'
            : 'bg-slate-800 text-slate-300';

    const rowStyle = theme === 'jazz'
        ? 'border-b border-[#D4AF37]/10 hover:bg-[#D4AF37]/5'
        : theme === 'soul'
            ? 'border-b border-[#93C5FD]/10 hover:bg-[#93C5FD]/5'
            : 'border-b border-slate-800 hover:bg-slate-800/50';

    const textColor = theme === 'jazz' ? 'text-[#D4AF37]' : theme === 'soul' ? 'text-[#93C5FD]' : 'text-slate-200';
    const subTextColor = theme === 'jazz' ? 'text-[#D4AF37]/60' : theme === 'soul' ? 'text-[#93C5FD]/60' : 'text-slate-500';

    const roleBadge = (role: string) => {
        if (role === 'MASTER') return theme === 'jazz'
            ? 'bg-red-500/20 text-red-400 border-red-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30';
        if (role === 'ADMIN') return theme === 'jazz'
            ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
            : theme === 'soul'
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        return theme === 'jazz'
            ? 'bg-white/5 text-[#D4AF37]/70 border-white/5'
            : 'bg-slate-800 text-slate-400 border-slate-700';
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('ko-KR');
        } catch { return dateStr; }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-3xl font-bold ${textColor}`}>User Management</h1>
                    <p className={subTextColor}>
                        {totalElements > 0 ? `총 ${totalElements}명의 사용자` : '사용자 관리'}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${subTextColor}`} />
                <input
                    type="text"
                    placeholder="닉네임 또는 이메일로 검색..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${theme === 'jazz'
                        ? 'bg-[#2C1F16]/50 border border-[#D4AF37]/20 text-[#D4AF37] placeholder-[#D4AF37]/40 focus:ring-[#D4AF37]/50'
                        : theme === 'soul'
                            ? 'bg-[#1E293B]/50 border border-[#93C5FD]/20 text-[#93C5FD] placeholder-[#93C5FD]/40 focus:ring-[#93C5FD]/50'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-cyan-500/50'
                    }`}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div className={`rounded-xl border overflow-hidden ${theme === 'jazz' ? 'border-[#D4AF37]/20 bg-[#2C1F16]/30' :
                theme === 'soul' ? 'border-[#93C5FD]/20 bg-[#1E293B]/30' :
                    'border-slate-800 bg-slate-900/50'
            }`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={tableHeaderStyle}>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Grade</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                                {currentUserRole === 'MASTER' && (
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={currentUserRole === 'MASTER' ? 5 : 4} className="px-6 py-12 text-center">
                                        <Loader2 className={`w-6 h-6 animate-spin mx-auto mb-2 ${subTextColor}`} />
                                        <span className={subTextColor}>로딩 중...</span>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={currentUserRole === 'MASTER' ? 5 : 4} className={`px-6 py-12 text-center ${subTextColor}`}>
                                        {searchTerm ? '검색 결과가 없습니다' : '사용자가 없습니다'}
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.userId} className={`transition-colors ${rowStyle}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'jazz' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                                                theme === 'soul' ? 'bg-[#93C5FD]/20 text-[#93C5FD]' :
                                                    'bg-slate-700 text-slate-300'
                                            }`}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className={`font-medium ${textColor}`}>{user.nickname}</div>
                                                <div className={`text-xs ${subTextColor}`}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {currentUserRole === 'MASTER' ? (
                                            <select
                                                value={user.roleType}
                                                onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none ${roleBadge(user.roleType)} bg-transparent`}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r} className="bg-slate-900 text-slate-200">{r}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadge(user.roleType)}`}>
                                                {(user.roleType === 'ADMIN' || user.roleType === 'MASTER') && <Shield size={12} />}
                                                {user.roleType}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${subTextColor}`}>
                                        {user.grade ? `${user.grade}등급` : '-'}
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${subTextColor}`}>
                                        {formatDate(user.createdAt)}
                                    </td>
                                    {currentUserRole === 'MASTER' && (
                                        <td className="px-6 py-4 text-right">
                                            {deleteConfirm === user.userId ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDelete(user.userId)}
                                                        className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                    >
                                                        확인
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(user.userId)}
                                                    className="p-2 rounded-lg transition-colors hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                                                    title="사용자 삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={`flex items-center justify-between px-6 py-3 border-t ${
                        theme === 'jazz' ? 'border-[#D4AF37]/10' :
                        theme === 'soul' ? 'border-[#93C5FD]/10' :
                        'border-slate-800'
                    }`}>
                        <span className={`text-sm ${subTextColor}`}>
                            {page * 20 + 1}-{Math.min((page + 1) * 20, totalElements)} / {totalElements}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
                                    theme === 'jazz' ? 'hover:bg-[#D4AF37]/20 text-[#D4AF37]' :
                                    theme === 'soul' ? 'hover:bg-[#93C5FD]/20 text-[#93C5FD]' :
                                    'hover:bg-slate-700 text-slate-400'
                                }`}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className={`flex items-center text-sm px-2 ${textColor}`}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${
                                    theme === 'jazz' ? 'hover:bg-[#D4AF37]/20 text-[#D4AF37]' :
                                    theme === 'soul' ? 'hover:bg-[#93C5FD]/20 text-[#93C5FD]' :
                                    'hover:bg-slate-700 text-slate-400'
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
