# Nova-Air App 추가 분석 — 알고리즘 & 데이터 전송

## 1. 알고리즘 분석 (`turbulence_analyzer.dart`)

### 1.1 직접 구현 여부

**전부 직접 구현**되어 있음. 외부 FFT 라이브러리 없이 순수 Dart로 작성.

### 1.2 구현된 구성요소

| 구성요소 | 설명 | 난이도 |
|---------|------|--------|
| `Complex` 클래스 | 복소수 덧셈/뺄셈/곱셈, `exp()` | 기초 |
| `_fftManual()` | 재귀 Cooley-Tukey FFT | 교과서 수준 |
| `_computePitch()` | Complementary Filter (가속도+자이로 융합) | 공식 한 줄 |
| `_computeDissipationRate()` | PSD → EDR 계산 | 중간 |
| `_integrate()` | 사다리꼴 수치 적분 | 기초 |
| `_padToPowerOf2()` | FFT용 2의 거듭제곱 패딩 | 기초 |
| `_fftFreq()` | 주파수 배열 생성 | 기초 |

### 1.3 처리 파이프라인

```
가속도 + 자이로 데이터
    ↓ Complementary Filter (α=0.98)
피치 계산 + 중력 보정 (Z축에서 중력 성분 제거)
    ↓ 2의 거듭제곱으로 패딩
FFT (Fast Fourier Transform) — 재귀 Cooley-Tukey
    ↓ magnitude 계산
PSD (Power Spectral Density) — magnitude² / freq
    ↓ 0.5~3.0Hz 대역 필터링
EDR (Eddy Dissipation Rate) — 사다리꼴 적분
    ↓
난기류 등급 분류
```

### 1.4 도메인 상수 (핵심)

알고리즘 자체보다 **이 상수들이 핵심**. 항공 도메인 지식에서 유래.

```dart
static const double nu = 1.5e-5;    // 운동 점성 계수 (m²/s)
static const double u = 1.0;        // 유동 속도 (m/s)
static const double fMin = 0.5;     // 최소 주파수 (Hz)
static const double fMax = 3.0;     // 최대 주파수 (Hz)
static const double alpha = 0.98;   // Complementary Filter 계수
static const double dt = 0.01;      // 샘플링 시간 (10ms)
static const double g = 9.81;       // 중력 가속도 (m/s²)
```

### 1.5 EDR 기반 심각도 분류 임계값

```
> 1.05 → Extreme (극심)
> 0.45 → Severe (심함)
> 0.20 → Moderate (보통)
> 0.10 → Light (약함)
≤ 0.10 → None (없음)
```

### 1.6 난이도 평가

**전체적으로 낮음~중간.**

- 알고리즘 자체: 교과서적 FFT + 기본 신호처리
- 도메인 상수: 항공 전문 지식 필요 (코드에서 가져오면 됨)
- JS/TS 포팅: Dart와 문법 유사, 120줄 1:1 변환 가능, 별도 라이브러리 불필요

---

## 2. 데이터 전송 경로

### 2.1 실제 동작하는 업로드: CSV 파일 → AWS S3

```
iOS 네이티브 (CMMotionManager)
    ↓ 100Hz 센서 데이터
CSV 파일 생성 (set{n}_{timestamp}_accel.csv / _gyro.csv)
    ↓ stopSession() → 파일 경로 반환
Flutter (FlightFileLog 레코드 생성, status=pending)
    ↓ 10초마다 백그라운드 체크
AWS S3 업로드 (minio.putObject)
```

### 2.2 S3 설정

| 항목 | 값 |
|------|-----|
| 엔드포인트 | `s3.ap-northeast-2.amazonaws.com` (서울 리전) |
| 버킷 | `smith-nova-log` |
| 키 패턴 | `flight_history/{flightName}_{recordType}_{timestamp}_{fileName}` |
| 예시 | `flight_history/UNKNOWN_accelerate_20260327_123456_set1_accel.csv` |

> ⚠️ AWS 자격증명(Access Key, Secret Key)이 소스코드에 하드코딩되어 있음 (보안 이슈)
> - `flight_file_log_background.dart` (line 39-40)
> - `log_table.dart` (line 171-172)

### 2.3 업로드 트리거

**자동 (백그라운드):**
- `flight_file_log_background.dart` — 10초마다 pending 상태 레코드 확인 → S3 업로드
- 네트워크 연결 시에만 시도 (WiFi/Mobile/Ethernet)

**수동 (UI):**
- `log_table.dart` — "재 전송" 버튼 클릭 → 동일한 S3 업로드 로직

### 2.4 데이터별 업로드 현황

| 데이터 | 로컬 저장 | 클라우드 업로드 | 상태 |
|--------|----------|----------------|------|
| Accel/Gyro **CSV 파일** | Isar FlightFileLog | AWS S3 putObject | ✅ 구현 완료 |
| GPS 로그 | Isar GpsLog | TODO | ❌ 미구현 |
| 기압 로그 | Isar PressureLog | TODO | ❌ 미구현 |
| 자이로 로그 (Dart) | Isar GyroLog | TODO | ❌ 미구현 |
| 가속도 로그 (Dart) | Isar AccelLog | TODO | ❌ 미구현 |
| 난기류 분석 결과 | Isar TurbulenceLog | TODO | ❌ 미구현 |

**결론: 실제로 서버에 올라가는 건 iOS 네이티브에서 생성한 CSV 파일뿐.**
Flutter Dart 쪽 센서 데이터(Isar DB)는 로컬에만 남아있음.

### 2.5 미사용 API 엔드포인트

| 파일 | URL | 용도 | 상태 |
|------|-----|------|------|
| `common_host.dart` | `http://3.36.94.126:8080/api/file/uploads` | 이미지 업로드 | 미사용 |
| `project_constant.dart` | `http://133.186.134.15:8080/web` | BASE_URL | 미사용 (TODO) |

### 2.6 백그라운드 태스크 현황

| 태스크 | 파일 | 실제 동작 |
|--------|------|----------|
| `filghtFileLogBackgroundServiceStart` | `flight_file_log_background.dart` | ✅ S3 업로드 실행 |
| `gpsBackgroundServiceStart` | `gps_background.dart` | ⚠️ sync=true 마킹만 (TODO) |
| `pressureBackgroundServiceStart` | `pressure_background.dart` | ⚠️ sync=true 마킹만 (TODO) |
| `gyroBackgroundServiceStart` | `gyro_background.dart` | ⚠️ sync=true 마킹만 |
| `accelerlateBackgroundServiceStart` | `accelerlate_background.dart` | ⚠️ sync=true 마킹만 |
| `turbulenceBackgroundServiceStart` | `turbulence_background.dart` | ⚠️ sync=true 마킹만 |
| `recordHistoryLogBackgroundServiceStart` | `record_history_log_background.dart` | ⚠️ 첫 레코드 반환만 |

> `background_service.dart`에서 실제 호출되는 건 `filghtFileLogBackgroundServiceStart()`만.

---

## 3. 데이터 이중 수집 구조

현재 센서 데이터가 **2곳에서 동시에 수집**되고 있음:

```
[경로 1] iOS 네이티브 (AppDelegate.swift)
CMMotionManager → CSV 파일 → S3 업로드 ✅

[경로 2] Flutter Dart (sensors_plus)
accelerometerEventStream → Riverpod → Isar DB → 로컬만 ❌
```

iOS 네이티브 쪽이 메인 데이터 파이프라인이고, Flutter Dart 쪽은 UI 표시용 + 향후 클라우드 전송 예정(TODO)으로 보임.
