import 'package:flutter_test/flutter_test.dart';

enum DisplayMode { normal, adzan, iqamah, syuruq, sholatStandby }

class DisplayStateEngine {
  DisplayMode _currentMode = DisplayMode.normal;

  DisplayMode get currentMode => _currentMode;

  void triggerAdzan() {
    _currentMode = DisplayMode.adzan;
  }

  void triggerIqamah() {
    _currentMode = DisplayMode.iqamah;
  }

  void triggerSyuruq() {
    _currentMode = DisplayMode.syuruq;
  }

  void resetToNormal() {
    _currentMode = DisplayMode.normal;
  }
}

void main() {
  group('Section 29.6 - State Engine Display & Priority Overlay Tests (TDD)', () {
    test('initial state defaults to DisplayMode.normal', () {
      final engine = DisplayStateEngine();
      expect(engine.currentMode, equals(DisplayMode.normal));
    });

    test('triggerAdzan updates mode to DisplayMode.adzan', () {
      final engine = DisplayStateEngine();
      engine.triggerAdzan();
      expect(engine.currentMode, equals(DisplayMode.adzan));
    });

    test('triggerIqamah updates mode to DisplayMode.iqamah', () {
      final engine = DisplayStateEngine();
      engine.triggerIqamah();
      expect(engine.currentMode, equals(DisplayMode.iqamah));
    });

    test('triggerSyuruq updates mode to DisplayMode.syuruq', () {
      final engine = DisplayStateEngine();
      engine.triggerSyuruq();
      expect(engine.currentMode, equals(DisplayMode.syuruq));
    });

    test('resetToNormal restores mode back to DisplayMode.normal', () {
      final engine = DisplayStateEngine();
      engine.triggerAdzan();
      expect(engine.currentMode, equals(DisplayMode.adzan));
      engine.resetToNormal();
      expect(engine.currentMode, equals(DisplayMode.normal));
    });
  });
}
