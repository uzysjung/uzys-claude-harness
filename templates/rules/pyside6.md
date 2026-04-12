# PySide6 Rules

data Track에서 적용.

## Architecture

- UI 정의는 코드로 작성. Qt Designer `.ui` 파일 사용 안 함.
- MVC 패턴: Model(데이터) / View(위젯) / Controller(시그널/슬롯 연결)
- 메인 윈도우는 `QMainWindow` 상속.

## Signals & Slots

```python
from PySide6.QtCore import Signal, Slot, QObject

class DataProcessor(QObject):
    progress = Signal(int)
    finished = Signal(object)

    @Slot()
    def process(self):
        for i in range(100):
            self.progress.emit(i)
        self.finished.emit(result)
```

## Threading (Critical)

- **UI 스레드에서 장시간 작업 금지** (DB 쿼리, 모델 학습, API 호출).
- `QThread` + Signal로 백그라운드 처리:

```python
class Worker(QThread):
    result_ready = Signal(object)

    def run(self):
        result = heavy_computation()
        self.result_ready.emit(result)
```

- UI 업데이트는 반드시 메인 스레드에서 (Signal → Slot 연결로 보장).

## Model/View

- 대용량 데이터: `QAbstractTableModel` 서브클래싱
- 커스텀 정렬/필터: `QSortFilterProxyModel`
- 셀 커스터마이징: `QStyledItemDelegate`

## Layout

- `QVBoxLayout` / `QHBoxLayout` 중첩
- `QSplitter` — 리사이저블 패널
- `QStackedWidget` — 페이지 전환
- 위젯 이름은 역할 기반: `self.search_input`, `self.result_table`

## Resources

- `importlib.resources` 또는 `QResource` 사용
- 아이콘: 벡터(SVG) 우선, 크기별 래스터 제공
