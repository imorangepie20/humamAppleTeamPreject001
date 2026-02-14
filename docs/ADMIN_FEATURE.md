# Admin 기능 명세서

> 작성일: 2026-02-14
> 상태: 구현 완료 (BE + FE + 배포)

---

## 1. 개요

관리자 페이지(`/admin`)에서 사용자 관리, 통계 조회 등을 수행하는 기능.
DB 연동된 실시간 사용자 목록 조회, 역할 변경, 삭제를 지원한다.

### 역할 체계

| 역할 | 권한 |
|------|------|
| **MASTER** | 전체 관리 (사용자 조회/역할 변경/삭제, 통계, 테마 변경) |
| **ADMIN** | 조회 전용 (사용자 목록, 통계) |
| **USER** | 관리자 API 접근 불가 (403) |

DB 컬럼: `users.user_role` ENUM(`'MASTER'`, `'ADMIN'`, `'USER'`)

---

## 2. BE API 명세

Base URL: `/api/admin`

### GET `/api/admin/users` — 사용자 목록

| 항목 | 값 |
|------|-----|
| 권한 | ADMIN, MASTER |
| Query Params | `search` (닉네임/이메일 검색), `page` (기본 0), `size` (기본 20) |

**응답 (Spring Page):**
```json
{
  "content": [
    {
      "userId": 6,
      "nickname": "Jo Woo Sung",
      "email": "jowoosung@gmail.com",
      "roleType": "MASTER",
      "grade": "1",
      "createdAt": "2026-01-01T00:00:00"
    }
  ],
  "totalElements": 10,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

### PATCH `/api/admin/users/{userId}/role` — 역할 변경

| 항목 | 값 |
|------|-----|
| 권한 | MASTER만 |
| Body | `{"roleType": "ADMIN"}` |
| 응답 | `{"message": "역할이 변경되었습니다"}` |

### DELETE `/api/admin/users/{userId}` — 사용자 삭제

| 항목 | 값 |
|------|-----|
| 권한 | MASTER만 |
| 제약 | 본인 계정 삭제 불가 (`userId == requesterId` 시 400 에러) |
| 응답 | `{"message": "사용자가 삭제되었습니다"}` |

### GET `/api/admin/stats` — 대시보드 통계

| 항목 | 값 |
|------|-----|
| 권한 | ADMIN, MASTER |

**응답:**
```json
{
  "totalUsers": 10,
  "totalTracks": 542,
  "totalPlaylists": 38
}
```

### 에러 응답

| 상황 | HTTP | 응답 |
|------|------|------|
| 인증 없음 | 403 | Spring Security 기본 |
| 권한 부족 (ADMIN이 삭제 시도) | 403 | `{"error": "MASTER 권한이 필요합니다"}` |
| 권한 부족 (USER가 목록 조회) | 403 | `{"error": "권한이 없습니다"}` |
| 본인 삭제 시도 | 400 | `{"error": "본인 계정은 삭제할 수 없습니다"}` |
| 존재하지 않는 userId | 400 | `{"error": "사용자를 찾을 수 없습니다: {id}"}` |

---

## 3. 권한 체계 구현

### 인증 (Authentication)
- `SecurityConfig.java`: `/api/admin/**`는 `permitAll()` 목록에 없음
- `.anyRequest().authenticated()`에 해당 → JWT 토큰 필수

### 인가 (Authorization)
- Controller 레벨에서 수동 역할 체크 (`@PreAuthorize` 미사용)
- `SystemSettingsController` 패턴 재사용

```java
private boolean isAdmin(CustomUserDetails userDetails) {
    if (userDetails == null) return false;
    RoleType role = userDetails.getUser().getRoleType();
    return role == RoleType.ADMIN || role == RoleType.MASTER;
}

private boolean isMaster(CustomUserDetails userDetails) {
    if (userDetails == null) return false;
    return userDetails.getUser().getRoleType() == RoleType.MASTER;
}
```

---

## 4. BE 파일 구조

```
2TeamFinalProject-BE/src/main/java/com/springboot/finalprojcet/
├── domain/admin/
│   ├── controller/
│   │   └── AdminController.java          ← REST 엔드포인트 4개
│   ├── service/
│   │   ├── AdminService.java             ← 인터페이스
│   │   └── impl/
│   │       └── AdminServiceImpl.java     ← 비즈니스 로직
│   └── dto/
│       ├── UserAdminDto.java             ← 사용자 목록 응답 DTO
│       ├── AdminStatsDto.java            ← 통계 응답 DTO
│       └── RoleUpdateRequest.java        ← 역할 변경 요청 DTO
└── domain/user/repository/
    └── UserRepository.java               ← findByNicknameContainingOrEmailContaining() 추가
```

### AdminServiceImpl 주요 로직

| 메서드 | 동작 |
|--------|------|
| `getAllUsers(search, page, size)` | search가 비어있으면 `findAll()`, 있으면 `findByNicknameContainingOrEmailContaining()`. createdAt DESC 정렬 |
| `updateUserRole(userId, roleType)` | `findById()` → `setRoleType()` → `save()` |
| `deleteUser(userId, requesterId)` | 본인 체크 → `findById()` → `delete()` |
| `getStats()` | `userRepository.count()` + `tracksRepository.count()` + `playlistRepository.count()` |

---

## 5. FE 구조

### API 서비스 (`src/services/api/admin.ts`)

```typescript
export const adminApi = {
    getUsers: (search?, page, size) => get<UsersPageResponse>('/admin/users?...')
    updateRole: (userId, roleType)  => patch('/admin/users/{id}/role', {roleType})
    deleteUser: (userId)            => del('/admin/users/{id}')
    getStats: ()                    => get<AdminStatsDto>('/admin/stats')
}
```

### UserManagement.tsx 기능

| 기능 | 구현 방식 |
|------|----------|
| 사용자 목록 | `useEffect` → `adminApi.getUsers()` 호출, 20명씩 페이징 |
| 검색 | 400ms 디바운스 → 닉네임/이메일 서버 검색 |
| 역할 변경 | MASTER만 `<select>` 드롭다운 표시, `adminApi.updateRole()` 호출 |
| 삭제 | MASTER만 삭제 아이콘 표시, 인라인 확인/취소 버튼 |
| 로딩 | `Loader2` 스피너 + "로딩 중..." 표시 |
| 에러 | 빨간 배경 에러 메시지 표시 |
| 페이징 | `ChevronLeft`/`ChevronRight` + "1/N" 표시 |
| 테마 | Jazz(Gold), Soul(Blue), Default(Cyan) 3종 지원 |

### 현재 유저 역할 파싱

```typescript
const token = localStorage.getItem('auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
// payload.role → 'MASTER' | 'ADMIN' | 'USER'
```

JWT claim 키: `role` (`JwtTokenProvider.java`에서 `.claim("role", role)`)

---

## 6. Nginx 이슈 & 해결

### 문제
보안 룰에 `admin` 키워드가 포함되어 있어 FE `/admin/users` 라우트가 404로 차단됨.

```nginx
# 문제가 된 룰 (양쪽 HTTPS 서버 블록에 존재)
location ~ /(admin|administrator|phpmyadmin|pma) { return 404; }
```

### 해결
`admin`을 제거하고 실제 공격 대상 경로만 남김.

```nginx
# 수정 후 (line 528, 941)
location ~ /(administrator|phpmyadmin|pma) { return 404; }
```

### 영향
- FE `/admin/*` 라우트: 정상 접근 가능
- BE `/api/admin/*` API: Nginx `/api/` catch-all 프록시로 Spring Boot에 전달 (이 룰 영향 안 받음이었으나, regex 특성상 `/api/admin/`도 매칭될 가능성이 있었음)
- `wp-admin` 차단: 별도 룰 (`/wp-(admin|login|content|includes)`)로 유지

---

## 7. 라우팅

```
App.tsx
└── /admin → ProtectedRoute → AdminLayout
    ├── index     → AdminDashboard (Mock 데이터)
    ├── users     → UserManagement ← DB 연동 완료
    ├── content   → ContentManagement (Mock 데이터)
    └── settings  → AdminSettings (테마 변경 연동)
```

- `ProtectedRoute`: JWT 토큰 존재 여부만 체크 (역할 체크는 하지 않음)
- `AdminLayout`: 좌측 사이드바(w-64) + 우측 콘텐츠 영역

---

## 8. 배포 방법

```bash
# Spring Boot (BE) — 이미지 빌드 필요
docker compose -f docker-compose.fullstack-local.yml up -d --build --no-deps spring-backend

# React (FE) — 볼륨 마운트이므로 빌드만
cd humamAppleTeamPreject001 && npm run build

# Nginx 설정 변경 시
docker restart musicspace-frontend
```

---

## 9. 미구현 / 향후 작업

| 항목 | 상태 | 비고 |
|------|------|------|
| AdminDashboard 통계 DB 연동 | 미구현 | `GET /api/admin/stats` API는 있으나 FE 대시보드는 Mock |
| ContentManagement DB 연동 | 미구현 | 트랙/플레이리스트 관리 API 필요 |
| ProtectedRoute 역할 기반 접근 제어 | 미구현 | 현재 로그인만 체크, ADMIN/MASTER 제한 없음 |
| 사용자 상세 모달 | 미구현 | 스트리밍 서비스, 플레이리스트 수 등 상세 정보 |
| 활동 로그 | 미구현 | 관리자 작업 이력 기록 |
