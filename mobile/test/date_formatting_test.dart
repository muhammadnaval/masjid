import 'package:flutter_test/flutter_test.dart';
import 'package:hijri/hijri_calendar.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('id_ID', null);
  });

  group('Section 29.10 - Gregorian & Hijri Date Formatting Unit Tests (TDD)', () {
    test('formats Gregorian date in Indonesian standard', () {
      final date = DateTime(2026, 8, 2);
      final formatted = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(date);
      expect(formatted, equals('Minggu, 2 Agustus 2026'));
    });

    test('formats Hijri date with zero offset', () {
      final date = DateTime(2026, 8, 2);
      final hijri = HijriCalendar.fromDate(date);
      final formatted = "${hijri.hDay} ${hijri.longMonthName} ${hijri.hYear} H";
      expect(formatted, contains('1448 H'));
    });

    test('applies positive Hijri correction offset (+2 days)', () {
      final date = DateTime(2026, 8, 2);
      final offsetDays = 2;
      final adjustedDate = date.add(Duration(days: offsetDays));
      final hijriAdjusted = HijriCalendar.fromDate(adjustedDate);

      final originalHijri = HijriCalendar.fromDate(date);
      expect(hijriAdjusted.hDay, equals(originalHijri.hDay + 2));
    });

    test('applies negative Hijri correction offset (-1 days)', () {
      final date = DateTime(2026, 8, 2);
      final offsetDays = -1;
      final adjustedDate = date.add(Duration(days: offsetDays));
      final hijriAdjusted = HijriCalendar.fromDate(adjustedDate);

      final originalHijri = HijriCalendar.fromDate(date);
      expect(hijriAdjusted.hDay, equals(originalHijri.hDay - 1));
    });
  });
}
