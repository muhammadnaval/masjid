import 'package:flutter_test/flutter_test.dart';

String applyTimeCorrection(String rawTime, int offsetMinutes) {
  final parts = rawTime.split(':');
  if (parts.length != 2) return rawTime;
  final hour = int.tryParse(parts[0]) ?? 0;
  final minute = int.tryParse(parts[1]) ?? 0;

  final totalMinutes = hour * 60 + minute + offsetMinutes;
  final adjustedHour = (totalMinutes ~/ 60) % 24;
  final adjustedMinute = totalMinutes % 60;

  return '${adjustedHour.toString().padLeft(2, '0')}:${adjustedMinute.toString().padLeft(2, '0')}';
}

void main() {
  group('Section 29.4 - Koreksi Waktu Sholat Unit Tests (TDD)', () {
    test('applies positive minute correction offset (+5 mins)', () {
      final rawSubuh = '04:46';
      final corrected = applyTimeCorrection(rawSubuh, 5);
      expect(corrected, equals('04:51'));
    });

    test('applies negative minute correction offset (-3 mins)', () {
      final rawDzuhur = '12:24';
      final corrected = applyTimeCorrection(rawDzuhur, -3);
      expect(corrected, equals('12:21'));
    });

    test('applies zero minute correction offset (0 mins)', () {
      final rawAshar = '15:47';
      final corrected = applyTimeCorrection(rawAshar, 0);
      expect(corrected, equals('15:47'));
    });

    test('handles hour boundary rollover correctly', () {
      final rawSubuh = '04:58';
      final corrected = applyTimeCorrection(rawSubuh, 5);
      expect(corrected, equals('05:03'));
    });
  });
}
