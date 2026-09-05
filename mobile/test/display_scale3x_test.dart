import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/widgets/display_typography.dart';

void main() {
  group('DisplayTypography — 3x enlargement (TDD)', () {
    test(
      '1920px: prayer card time is ~3x the pre-enlargement size (12→36)',
      () {
        final typo = DisplayTypography.fromScreenWidth(1920);

        // Pre-enlargement baseline was 12; 3x = 36
        expect(typo.prayerTimeFontSize, greaterThanOrEqualTo(36));
      },
    );

    test('1920px: header clock is ~3x the pre-enlargement size (29→87)', () {
      final typo = DisplayTypography.fromScreenWidth(1920);

      // Pre-enlargement baseline was 29; 3x = 87
      expect(typo.clockFontSize, greaterThanOrEqualTo(87));
    });

    test('1920px: header dates scale to match clock prominence', () {
      final typo = DisplayTypography.fromScreenWidth(1920);

      // Gregorian date was 13 → 3x = 39
      expect(typo.headerDateFontSize, greaterThanOrEqualTo(39));
      // Hijri date was 11 → 3x = 33
      expect(typo.headerHijriFontSize, greaterThanOrEqualTo(33));
    });

    test('1920px: header identity scales proportionally', () {
      final typo = DisplayTypography.fromScreenWidth(1920);

      // Mosque name was 20 → 3x = 60
      expect(typo.headerNameFontSize, greaterThanOrEqualTo(60));
      // Address was 11 → 3x = 33
      expect(typo.headerAddressFontSize, greaterThanOrEqualTo(33));
    });

    test('4K caps remain sane after 3x enlargement', () {
      final typo = DisplayTypography.fromScreenWidth(3840);

      expect(typo.prayerTimeFontSize, lessThanOrEqualTo(51));
      expect(typo.clockFontSize, lessThanOrEqualTo(121));
    });

    test('720p remains readable after scaling', () {
      final typo = DisplayTypography.fromScreenWidth(1280);

      expect(typo.prayerTimeFontSize, greaterThanOrEqualTo(24));
      expect(typo.clockFontSize, greaterThanOrEqualTo(58));
    });

    test('scaling remains proportional across widths', () {
      final small = DisplayTypography.fromScreenWidth(1280);
      final medium = DisplayTypography.fromScreenWidth(1920);
      final large = DisplayTypography.fromScreenWidth(3840);

      expect(medium.prayerTimeFontSize, greaterThan(small.prayerTimeFontSize));
      expect(large.prayerTimeFontSize, greaterThan(medium.prayerTimeFontSize));
      expect(medium.clockFontSize, greaterThan(small.clockFontSize));
      expect(large.clockFontSize, greaterThan(medium.clockFontSize));
    });
  });
}
