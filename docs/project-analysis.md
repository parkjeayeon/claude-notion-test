# Nova-Air App 프로젝트 분석

## 1. 프로젝트 개요

**항공 난기류 모니터링 및 비행 데이터 기록 앱**

비행 중 스마트폰 내장 센서(가속도계, 자이로스코프, 기압계, GPS)로 데이터를 수집하고, FFT 기반 분석으로 난기류를 자동 감지합니다.

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Flutter (Dart, 멀티 플랫폼) |
| 상태관리 | Riverpod (StateNotifier 패턴) |
| 로컬 DB | Isar (NoSQL, 7개 컬렉션) |
| 네트워크 | Retrofit + Dio |
| 클라우드 | MinIO (S3 호환 스토리지) |
| 모니터링 | Sentry Flutter |
| 차트 | FL Chart |
| 로컬 저장 | flutter_secure_storage, shared_preferences |
| 센서 | sensors_plus, flutter_barometer, geolocator |
| 백그라운드 | flutter_background_service |
| 로케일 | Korean (ko_KR) |

---

## 3. 프로젝트 구조

```
lib/
├── main.dart                              # 앱 진입점 (Sentry 초기화)
├── infrastructure/
│   ├── background/
│   │   ├── service/background_service.dart    # 백그라운드 태스크 오케스트레이션
│   │   ├── task/                              # 백그라운드 태스크 (8종)
│   │   │   ├── accelerate_background.dart
│   │   │   ├── gps_background.dart
│   │   │   ├── gyro_background.dart
│   │   │   ├── pressure_background.dart
│   │   │   ├── turbulence_background.dart
│   │   │   ├── record_history_log_background.dart
│   │   │   └── flight_file_log_background.dart
│   │   └── native/native_bridge_task.dart     # 네이티브 브릿지
│   ├── isar/
│   │   ├── entity/                            # 7개 Isar 컬렉션 엔티티
│   │   │   ├── accerlate_log.dart
│   │   │   ├── flight_file_log.dart
│   │   │   ├── gps_log.dart
│   │   │   ├── gyro_log.dart
│   │   │   ├── pressure_log.dart
│   │   │   ├── record_history_log.dart
│   │   │   └── turbulence_log.dart
│   │   └── service/isar_service.dart          # 싱글톤 DB 서비스
│   ├── riverpod/                              # 상태 관리 (10개 프로바이더)
│   │   ├── accelerate/
│   │   ├── gps/
│   │   ├── gyro/
│   │   ├── pressure/
│   │   ├── turbulence/
│   │   ├── flight/
│   │   ├── flight_log/
│   │   ├── record/
│   │   ├── recordhistory/
│   │   └── storage/
│   ├── auth/location_permission.dart
│   └── util/turbulence_analyzer.dart          # FFT 기반 난기류 분석
└── presentation/
    ├── routes/routes.dart
    ├── theme/theme_helper.dart
    └── ui/                                    # 101개 UI 파일
        ├── splash/
        ├── navigator/main_navigator.dart      # 하단 탭: 업로드 기록, 홈
        ├── home/                              # 대시보드
        ├── log/                               # 비행 로그
        ├── schedule/                          # 비행 스케줄
        ├── log_edit/                          # 로그 편집
        └── common/                            # 공통 컴포넌트
```

---

## 4. 주요 기능

### 4.1 비행 모니터링
- 실시간 비행 상태 추적 (WAIT, PROCESSING, PAUSE, TURBULENCE)
- 네트워크 연결 상태 모니터링
- 저장 공간 사용량 모니터링
- 비행명/헤딩 값 관리

### 4.2 센서 데이터 수집
- 가속도계 (X, Y, Z축) — 100Hz
- 자이로스코프 — 100Hz
- 기압계 — 1Hz
- GPS (위도, 경도, 속도, 방위, 정확도)

### 4.3 난기류 분석
- FFT(Fast Fourier Transform) 기반 신호 분석
- EDR(Eddy Dissipation Rate) 계산
- 보상 필터 (alpha = 0.98)
- 자동/수동 난기류 보고

### 4.4 데이터 저장 및 동기화
- Isar 로컬 DB (7개 엔티티)
- 동기화 상태 추적 (pending, success, failure)
- MinIO S3 호환 클라우드 업로드
- 파일 압축

### 4.5 UI 화면
- **Home**: 측정 현황, 통신 상태, 저장 공간, 난기류 기록
- **Log**: 비행 로그 목록/필터링
- **Schedule**: 비행 스케줄 관리
- **Log Edit**: 비행 로그 편집

---

## 5. 센서 상세 분석

### 5.1 지원 센서 (4종, 스마트폰 내장)

| 센서 | 샘플링 주기 | 용도 |
|------|------------|------|
| 가속도계 | 10ms (100Hz) | 진동/가속도 측정 (X,Y,Z) |
| 자이로스코프 | 10ms (100Hz) | 회전 속도 측정 (X,Y,Z) |
| 기압계 | 1000ms (1Hz) | 대기압 (hPa) |
| GPS | on-demand | 위치, 속도, 방위, 정확도 |

> PM2.5, CO2 등 공기질 센서는 없음 — 순수 항공 모션 센서 앱

### 5.2 데이터 수집 흐름

```
하드웨어 센서
    ↓
iOS: CMMotionManager (적응형 샘플링 25-100Hz)
Flutter: sensors_plus 스트림
    ↓
Riverpod StateNotifier (메모리 버퍼)
    ↓ (50-1000샘플 배치)
Isar 로컬 DB
    ↓ (백그라운드 싱크)
MinIO 클라우드 업로드
```

### 5.3 데이터 모델 (Isar 엔티티)

**AccelerlateLog (가속도계)**
- id, accX, accY, accZ, flightName, createdAt (double ms), sync

**GyroLog (자이로스코프)**
- id, accX, accY, accZ, flightName, createdAt, historyId, sync

**PressureLog (기압계)**
- id, hpa, flightName, createdAt, historyId, sync

**GpsLog (GPS)**
- id, latitude, longitude, speed, bearing, accuracy, flightName, createdAt, historyId, sync

**RecordHistoryLog (세션 메타데이터)**
- id, startedAt, endAt, sync, isRecording

**TurbulenceLog (난기류 분석 결과)**
- severityLevel (none/light/moderate/severe/extreme)
- sensationSeverityLevel, edrValue, duration, automation, createdAt, historyId, sync

### 5.4 난기류 분석 알고리즘 (`turbulence_analyzer.dart`)

```
가속도 + 자이로 데이터
    ↓ Complementary Filter (α=0.98)
피치 계산 + 중력 보정
    ↓ FFT (Fast Fourier Transform)
주파수 영역 변환
    ↓ PSD (Power Spectral Density)
0.5~3.0Hz 대역 적분
    ↓ EDR (Eddy Dissipation Rate) 계산
난기류 등급 분류
```

**EDR 기반 심각도 분류:**

| EDR 값 | 등급 |
|--------|------|
| > 1.05 | Extreme |
| > 0.45 | Severe |
| > 0.20 | Moderate |
| > 0.10 | Light |
| ≤ 0.10 | None |

**물리 상수:**
- 운동 점성: 1.5e-5 m²/s
- 유속: 1.0 m/s
- 주파수 범위: 0.5-3.0 Hz
- 중력: 9.81 m/s²
- 보상 필터 계수: 0.98

### 5.5 현재 제한사항
- 난기류 분석 타이머 **주석 처리됨** (flight_log_notifier.dart:84-142)
- 클라우드 업로드 엔드포인트 **TODO 상태**
- GPS는 연속 스트림이 아닌 on-demand 방식
- 외부 센서 미지원 (내장 IMU/GPS만)

---

## 6. iOS 네이티브 코드 분석 (`AppDelegate.swift`)

약 970줄의 Swift 코드. 3번의 메이저 버전 최적화(v1→v3)를 거침.

### 6.1 Flutter ↔ Native 통신

- `FlutterMethodChannel("smith.audio.channel")` — `start_audio` / `stop_audio`
- `FlutterEventChannel("smith.accelerometer.channel")` — 스트림 핸들러 (현재 미사용)
- Flutter에서 `start_audio` 호출 → 네이티브 센서 수집 시작
- `stop_audio` → CSV 파일 경로 배열 반환

### 6.2 동작 흐름

```
Flutter: start_audio 호출
    ↓
startSession()
├── AVAudioSession 설정 (.playback, mixWithOthers)
├── silent.mp3 무한 재생 (백그라운드 유지 트릭)
├── CSV 파일 생성 (set{n}_{timestamp}_accel.csv / _gyro.csv)
├── CMMotionManager.startDeviceMotionUpdates() — 100Hz
├── CLLocationManager.startUpdatingLocation()
└── 타이머 시작 (버퍼 플러시 60s, 오디오 체크 60s, 파일 로테이션 3-6h)

센서 콜백 (100Hz)
├── CMDeviceMotion → userAcceleration(X,Y,Z) + rotationRate(X,Y,Z)
├── formatLine()으로 CSV 행 생성 (스택 버퍼, 힙 할당 0)
├── writeQueue에 accel/gyro 버퍼 append (단일 dispatch)
├── 적응형 Hz 판단 (magnitude 기반)
└── 버퍼 48KB 초과 시 파일 flush

Flutter: stop_audio 호출
    ↓
stopSession()
├── 센서/타이머/오디오 중지
├── 버퍼 최종 flush + 파일 닫기
└── rotatedFileSets (파일 경로 배열) 반환 → Flutter로 전달
```

### 6.3 최적화 이력 (v1 → v3)

| 영역 | 기법 | 효과 |
|------|------|------|
| 메모리 | `formatLine()` 80B 스택 버퍼, `writeInt`/`writeDouble` 직접 ASCII 변환 | 힙 할당 0회 |
| I/O | FileHandle 세션간 유지, 48KB 임계치 배치 쓰기, 60초 주기 flush | I/O wake-up 최소화 |
| 배터리 | 적응형 샘플링 25-100Hz, 백그라운드 시 25Hz 강제, Low Power Mode 대응 | 정적 구간 75% 절약 |
| 스레드 | motionQueue → writeQueue 단일 dispatch (2회→1회), QoS `.background` | CPU 50% 감소 |
| 파일 관리 | 충전 시 3시간 / 배터리 시 6시간 로테이션 | 파일 크기 제한 |
| 백그라운드 | silent.mp3 + AVAudioSession, 인터럽트/라우트 변경 자동 복구 | 앱 kill 방지 |

### 6.4 적응형 샘플링 상세

- `userAcceleration` magnitude 기반
- magnitude < 0.015g 이하 50프레임(0.5초) 연속 → 25Hz로 전환
- magnitude > 0.06g 초과 → 즉시 100Hz 복귀
- 백그라운드 진입 시 무조건 25Hz
- Low Power Mode 시 25Hz 강제

---

## 7. RN(Expo) 전환 가능성 분석

실행 환경: `npx expo run:ios --device` (development build, 네이티브 모듈 사용 가능)

### 7.1 Expo 패키지로 바로 가능한 것

| 기능 | Expo 패키지 | 비고 |
|------|------------|------|
| 가속도계 | `expo-sensors` (Accelerometer) | `setUpdateInterval(10)` → 100Hz |
| 자이로스코프 | `expo-sensors` (Gyroscope) | 100Hz |
| 기압계 | `expo-sensors` (Barometer) | 1Hz |
| GPS | `expo-location` | foreground/background |
| 로컬 DB | `expo-sqlite` 또는 WatermelonDB | Isar 대체 |
| FFT 분석 | JS로 구현 | turbulence_analyzer.dart 포팅 |

### 7.2 주의가 필요한 것

**백그라운드 센서 수집 — 가장 큰 난관**
- `expo-task-manager`는 주기적 fetch (최소 15분 간격)만 지원
- 100Hz 연속 센서 스트리밍은 foreground에서만 안정적
- silent audio trick은 네이티브 모듈로 직접 구현 필요

**iOS 네이티브 최적화 재현**
- 적응형 샘플링, zero heap allocation, 48KB 버퍼 등
- → `expo-modules`로 Swift 네이티브 모듈 작성 필요

**고주파 데이터 배치 저장**
- 100Hz × 3축 = 초당 300개 데이터포인트
- JS 브릿지 오버헤드 → 배치 처리 전략 필수

### 7.3 구현 전략

```
[Tier 1] Expo 패키지만으로 구현
├── Foreground 센서 수집 (가속도/자이로/기압/GPS)
├── FFT 난기류 분석 (JS 포팅)
├── 로컬 DB 저장 (expo-sqlite)
└── UI (측정 현황, 난기류 등급 표시)

[Tier 2] 네이티브 모듈 필요 (expo-modules)
├── 백그라운드 연속 센서 수집 (silent audio)
├── 적응형 샘플링 (CMMotionManager 직접 제어)
└── 고성능 CSV 파일 기록
```

### 7.4 배터리 최적화 — RN에서 동일하게 재현 가능

| 최적화 | Swift 레벨 | RN 호환 |
|--------|-----------|---------|
| 적응형 샘플링 (100↔25Hz) | CMMotionManager 직접 조절 | 동일 |
| 백그라운드 진입 시 25Hz 강제 | UIApplication 노티피케이션 | 동일 |
| Low Power Mode 감지 → 25Hz | NSProcessInfo 노티피케이션 | 동일 |
| 충전 상태별 rotation 간격 | UIDevice.batteryState | 동일 |
| writeQueue 단일 dispatch | GCD DispatchQueue | 동일 |
| motionQueue QoS .background | OperationQueue | 동일 |
| 48KB 임계치 배치 쓰기 | FileHandle + Data 버퍼 | 동일 |
| 80B 스택 버퍼 (힙 할당 0) | withUnsafeTemporaryAllocation | 동일 |
| Silent audio 백그라운드 유지 | AVAudioSession + AVAudioPlayer | 동일 |

> AppDelegate.swift 970줄 중 Flutter 의존 부분은 채널 바인딩 ~20줄뿐.
> 나머지 950줄은 순수 iOS API → expo-modules로 감싸기만 하면 됨.

---

## 8. 추가 배터리 최적화 방안

모두 Swift 네이티브 코드 수정 (Flutter 의존 없음, RN 전환 후에도 유효)

### 8.1 즉시 적용 가능 (코드 변경만)

**① Timer tolerance 설정 — 시스템 타이머 병합**
```swift
bufferFlushTimer?.tolerance = 10.0   // ±10초 허용
audioCheckTimer?.tolerance  = 15.0   // ±15초 허용
```
iOS가 타이머를 병합 처리. wake-up 횟수 30-50% 감소.

**② 정적 구간에서 센서 완전 정지**
- 정적 300프레임(12초) 연속 → 센서 일시 정지
- 2초마다 짧은 샘플링으로 동적 복귀 감지
- 지상 대기 구간 센서 전력 90%+ 절약

**③ 자이로 조건부 수집**
- 저진동 구간에서 gyro 기록 N번째마다 1회만 (25Hz → ~6Hz)
- 자이로 CSV I/O 정적 구간 75% 감소

**④ Location 수집 최적화**
```swift
// 정확도 낮춤 (비행 중 높은 정확도 불필요)
locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
// 거리 필터 적용
locationManager.distanceFilter = 50  // 50m 이동 시만 업데이트
```
GPS 전력 30-40% 절약.

### 8.2 중간 난이도 (구조 변경 필요)

**⑤ CMMotionActivityManager 활용 — 상태 기반 전략**
- iOS 코프로세서 기반 활동 인식 (stationary/automotive/unknown)
- 추가 전력 거의 없이 지능적 수집 전략 전환

**⑥ DispatchSource.makeTimerSource 전환**
- Timer보다 낮은 오버헤드 + 시스템 레벨 코얼레싱 지원

**⑦ AVAudioEngine 전환**
- 파일 기반 AVAudioPlayer → 무음 버퍼 루프 재생
- 파일 디코딩 CPU 제거

### 8.3 영향도 순위

| 순위 | 최적화 | 예상 절약 | 난이도 |
|------|--------|----------|--------|
| 1 | Location 정확도/필터 | 30-40% GPS 전력 | 낮음 |
| 2 | 정적 구간 센서 정지 | 대기 시 90%+ 센서 전력 | 중간 |
| 3 | Timer tolerance | wake-up 30-50% 감소 | 매우 낮음 |
| 4 | CMMotionActivity 활용 | 전체 10-20% | 중간 |
| 5 | 자이로 조건부 기록 | I/O 75% 감소 (정적) | 낮음 |
| 6 | DispatchSource 전환 | 소폭 개선 | 낮음 |
| 7 | AVAudioEngine 전환 | 소폭 개선 | 중간 |
