# Nova-Air App 추가 분석 — 핵심 포인트 & RN 전환 판단

## 1. RN 전환 시 핵심 포인트 정리

### 1.1 Silent Audio 백그라운드 유지 트릭

iOS는 백그라운드에서 앱을 kill하지만, **무음 오디오를 무한 재생**해서 앱을 살려둠.
이게 없으면 백그라운드 센서 수집 불가능.

- `AVAudioSession` 카테고리 `.playback` + `.mixWithOthers`
- `silent.mp3` 무한 루프 재생 (volume = 0.0)
- 오디오 인터럽트(전화, 다른 앱 등) 시 자동 복구 로직 포함
- 라우트 변경(이어폰 분리 등) 시에도 자동 복구
- **RN에서도 반드시 재현해야 하는 핵심 기능**

### 1.2 데이터 이중 수집 구조

현재 센서 데이터가 **2곳에서 동시에** 수집됨:

```
[경로 1] iOS 네이티브 (AppDelegate.swift)
CMMotionManager → CSV 파일 → S3 업로드 ✅ (실제 데이터 파이프라인)

[경로 2] Flutter Dart (sensors_plus)
accelerometerEventStream → Riverpod → Isar DB → 로컬만 ❌ (UI 표시용, 클라우드 전송 TODO)
```

RN 전환 시 **하나로 통합할지 판단** 필요한 설계 포인트.

### 1.3 파일 로테이션

장시간 비행 시 CSV 크기 제한을 위해 주기적 파일 분할:
- 충전 중: 3시간마다 로테이션
- 배터리: 6시간마다 로테이션
- `stopSession()` 시 분할된 파일 세트 배열 반환

### 1.4 보안 이슈

AWS 자격증명(Access Key, Secret Key)이 소스코드에 **하드코딩**됨:
- `flight_file_log_background.dart` (line 39-40)
- `log_table.dart` (line 171-172)
- RN 전환 시 반드시 환경변수 또는 보안 저장소로 이동 필요

### 1.5 미완성 기능들

- 난기류 분석 타이머 **주석 처리** 상태 (flight_log_notifier.dart:84-142)
- 6개 백그라운드 태스크 중 **1개만 실제 동작** (S3 CSV 업로드)
- API 엔드포인트 2개 정의되어 있지만 **미사용**
  - `http://3.36.94.126:8080/api/file/uploads`
  - `http://133.186.134.15:8080/web`

---

## 2. iOS 네이티브 코드 — RN에서 다시 짤 필요 없음

### 2.1 핵심 판단

`AppDelegate.swift` 약 970줄 중:
- **Flutter 의존 코드: ~20줄** (FlutterMethodChannel 바인딩)
- **순수 Swift 코드: ~950줄** (센서, 오디오, 파일, 최적화 전부)

→ **Swift 코드를 그대로 가져가고, 바인딩만 교체하면 됨**

### 2.2 전환 작업

```
현재 (Flutter):
FlutterMethodChannel("smith.audio.channel")
    ↓ start_audio / stop_audio
순수 Swift 코드 950줄

RN(Expo) 전환 후:
ExpoModule.Function("startSession")
    ↓
동일한 Swift 코드 950줄 (그대로 복사)
```

### 2.3 실제 해야 할 작업

1. `expo-modules`로 Swift 모듈 껍데기 생성
2. `AppDelegate.swift`의 센서/오디오/파일 로직을 해당 모듈로 복사
3. `FlutterMethodChannel` 바인딩 → `ExpoModule` 바인딩으로 교체 (~20줄)

### 2.4 그대로 재사용되는 것들

- ✅ CMMotionManager 센서 수집 (100Hz)
- ✅ 적응형 샘플링 (25-100Hz 전환)
- ✅ 스택 버퍼 포맷팅 (힙 할당 0)
- ✅ 48KB 배치 쓰기 + FileHandle 유지
- ✅ Silent audio 백그라운드 유지
- ✅ 오디오 인터럽트/라우트 변경 자동 복구
- ✅ Low Power Mode 대응
- ✅ 배터리 상태별 파일 로테이션
- ✅ 백그라운드 진입 시 25Hz 강제
- ✅ CSV 파일 생성 및 경로 반환

### 2.5 이중 수집 통합 판단

현재 Flutter Dart 쪽(`sensors_plus` → Isar DB)이 **별도로 또 수집**하고 있음.
RN 전환 시 선택지:

| 옵션 | 설명 | 장단점 |
|------|------|--------|
| A. 네이티브만 유지 | iOS Swift에서만 수집, JS는 결과만 받음 | 단순, 배터리 효율적 / UI 실시간 표시 제한 |
| B. 이중 수집 유지 | 네이티브(CSV) + JS(UI용) 동시 수집 | 현재와 동일 / 리소스 중복 |
| C. 네이티브 → JS 스트리밍 | 네이티브에서 수집 후 JS로 이벤트 전달 | 단일 소스 / 브릿지 오버헤드 |
