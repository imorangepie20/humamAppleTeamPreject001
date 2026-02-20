# 배포 시 별도 제공해야 하는 파일 목록

생성일: 2026-02-21
프로젝트: music-space

---

## 1. 환경변수 파일

| 경로 | 크기 | 설명 |
|-----|------|------|
| `humamAppleTeamPreject001/.env` | < 1KB | 모든 프로젝트 공유 환경변수 |

**참고 파일**: `humamAppleTeamPreject001/server/.env.example`, `FAST_API/.env.example`

---

## 2. SSL 인증서 (40KB)

전체 경로: `humamAppleTeamPreject001/ssl/`

| 경로 | 크기 | 설명 |
|-----|------|------|
| `ssl/config/live/imapplepie20.tplinkdns.com/fullchain.pem` | 2.8KB | SSL 인증서 체인 |
| `ssl/config/live/imapplepie20.tplinkdns.com/privkey.pem` | 241B | **개인키 (민감 정보)** |
| `ssl/config/archive/imapplepie20.tplinkdns.com-0001/` | - | 백업 인증서 |
| `ssl/config/accounts/` | - | Let's Encrypt 계정 정보 |
| `ssl/config/renewal/` | - | 갱신 설정 |

---

## 3. 업로드 파일 (1.77GB)

### 3.1 images/ - 949MB

경로: `humamAppleTeamPreject001/public/images/`

| 디렉토리/파일 | 크기 | 설명 |
|-------------|------|------|
| `images/albums` | 617MB | 앨범 커버 이미지 |
| `images/tracks` | 278MB | 트랙 이미지 |
| `images/covers` | 27MB | 추가 커버 이미지 |
| `images/artists` | 5.2MB | 아티스트 이미지 |
| `images/theme` | 20MB | 테마 관련 이미지 |
| `images/jazz_bg.jpg` | 96KB | 배경 이미지 |
| `images/jazz_bg.png` | 2.5MB | 배경 이미지 |

### 3.2 uploads/ - 820MB

경로: `humamAppleTeamPreject001/public/uploads/`

| 디렉토리 | 크기 | 설명 |
|---------|------|------|
| `uploads/playlists` | 621MB | 사용자 플레이리스트 이미지 |
| `uploads/tracks` | 199MB | 사용자 업로드 트랙 이미지 |

### 3.3 webroot/

경로: `humamAppleTeamPreject001/public/webroot/`

| 디렉토리 | 설명 |
|---------|------|
| `.well-known/acme-challenge/` | Let's Encrypt SSL 인증용 |

---

## 4. ML 모델 파일 (933MB)

경로: `FAST_API/`

| 디렉토리 | 크기 | 설명 |
|---------|------|------|
| `LLM/` | 622MB | LLM 관련 모델 |
| `LLM/L2/data/chroma_db/` | 258MB | ChromaDB 벡터 데이터베이스 |
| `M1/` | 15MB | 오디오 특성 예측 모델 |
| `M1/user_models/` | 14MB | 사용자별 M1 모델 |
| `M2/` | 16MB | 콘텐츠 기반 추천 모델 |
| `M2/user_models/` | 1.8MB | 사용자별 M2 모델 |
| `M3/` | 3.5MB | 협업 필터링 모델 |
| `M3/user_models/` | 2.4MB | 사용자별 M3 모델 |

### ML 모델 파일 확장자
- `*.pkl` - Python 모델 파일
- `*.npy` - NumPy 배열 (임베딩)
- `*.zip`, `*.7z` - 압축된 모델 파일

---

## 5. Python 가상환경 (선택 사항)

| 경로 | 크기 | 설명 |
|-----|------|------|
| `FAST_API/venv/` | 1-2GB | Python 가상환경 |

**권장**: 서버에서 직접 생성
```bash
cd FAST_API
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

---

## 요약

| 항목 | 경로 | 크기 |
|-----|------|------|
| 환경변수 | `.env` | < 1KB |
| SSL 인증서 | `ssl/` | 40KB |
| 이미지 | `public/images/` | 949MB |
| 업로드 | `public/uploads/` | 820MB |
| ML 모델 | `FAST_API/{LLM,M1,M2,M3}/` | 933MB |
| **최종 합계** | | **~2.7GB** |

---

## 프로젝트 구조

```
music-space/
├── humamAppleTeamPreject001/     (React 프론트엔드)
│   ├── .env                       <- 환경변수
│   ├── ssl/                       <- SSL 인증서
│   └── public/
│       ├── images/                <- 앨범/트랙 이미지 (949MB)
│       ├── uploads/               <- 사용자 업로드 (820MB)
│       └── webroot/               <- SSL 인증용
│
├── imapplepieTemplate001/         (React 어드민)
│
├── 2TeamFinalProject-BE/          (Java Spring Boot)
│
└── FAST_API/                      (Python AI 서버)
    ├── LLM/                       <- LLM 모델 (622MB)
    ├── M1/                        <- 오디오 예측 (15MB)
    ├── M2/                        <- 콘텐츠 추천 (16MB)
    └── M3/                        <- 협업 필터링 (3.5MB)
```

---

## 전송 방법 권장

1. **.env 파일**: 내용만 복사해서 서버에서 직접 생성
2. **SSL 인증서**: scp/sftp로 전송 (privkey.pem 보고 주의)
3. **이미지/업로드**: scp/rsync로 전송 (용량 큼)
4. **ML 모델**: ftp/scp로 전송 (용량 큼)
5. **venv**: 서버에서 재생성 권장 (requirements.txt 사용)

---

## 6. 데이터베이스 백업 (30MB)

경로: `humamAppleTeamPreject001/`

| 파일 | 크기 | 설명 |
|-----|------|------|
| `music_space_db_backup_20260209_071200.sql` | 6.3MB | 최신 DB 백업 (2026-02-09) |
| `db_backup_20260204.sql` | 10MB | DB 백업 #1 |
| `music_space_backup.sql` | 8.3MB | DB 백업 #2 |
| `music_space_db_dump.sql` | 5.6MB | DB 덤프 |

---

## 요약 (최종)

| 항목 | 경로 | 크기 |
|-----|------|------|
| 환경변수 | `.env` | < 1KB |
| SSL 인증서 | `ssl/` | 40KB |
| 이미지 | `public/images/` | 949MB |
| 업로드 | `public/uploads/` | 820MB |
| ML 모델 | `FAST_API/{LLM,M1,M2,M3}/` | 933MB |
| DB 백업 | `*.sql` | 30MB |
| **최종 합계** | | **~2.73GB** |

---

## Google Drive 다운로드

**배포 파일 전체 압축**: [deployment_files.tar.gz](https://drive.google.com/file/d/1QXrzEbgkd1qmSz8wQ2Hxu9CPLnqm2d2-/view?usp=sharing)

> 크기: 2.1GB (압축 상태)

---

## GitHub 저장소

| 프로젝트 | URL |
|---------|-----|
| humamAppleTeamPreject001 | https://github.com/imorangepie20/humamAppleTeamPreject001 |
| imapplepieTemplate001 | https://github.com/imorangepie20/imapplepieTemplate001 |
| 2TeamFinalProject-BE | https://github.com/imorangepie20/2TeamFinalProject-PB |
| FAST_API | https://github.com/imorangepie20/FAST_API-PB |
