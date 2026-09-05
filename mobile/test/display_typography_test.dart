import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/widgets/prayer_schedule_row.dart';
import 'package:masjid_display/widgets/display_typography.dart';
import 'package:masjid_display/models/prayer_schedule.dart';
import 'package:masjid_display/models/display_state.dart';

void main() {
  group('DisplayTypography', () {
    test('1920px (1080p) produces target font sizes for 10m readability', () {
      final typography = DisplayTypography.fromScreenWidth(1920);

      // Bottom prayer card — must be readable from 10m
      expect(typography.prayerTimeFontSize, greaterThanOrEqualTo(32));
      expect(typography.prayerNameFontSize, greaterThanOrEqualTo(16));
      expect(typography.nextBadgeFontSize, greaterThanOrEqualTo(10));
      expect(typography.countdownFontSize, greaterThanOrEqualTo(14));
      expect(typography.iconSize, greaterThanOrEqualTo(22));

      // Header information — enlarged for TV readability
      expect(typography.headerNameFontSize, greaterThanOrEqualTo(60));
      expect(typography.headerAddressFontSize, greaterThanOrEqualTo(33));
      expect(typography.headerDateFontSize, greaterThanOrEqualTo(39));
      expect(typography.headerHijriFontSize, greaterThanOrEqualTo(33));
      expect(typography.clockFontSize, greaterThanOrEqualTo(87));
    });

    test('1280px (720p) scales down but stays readable', () {
      final typography = DisplayTypography.fromScreenWidth(1280);

      // Even on smaller screens, time must be readable
      expect(typography.prayerTimeFontSize, greaterThanOrEqualTo(22));
      expect(typography.prayerNameFontSize, greaterThanOrEqualTo(11));
      expect(typography.clockFontSize, greaterThanOrEqualTo(58));
    });

    test('3840px (4K) scales up but caps at reasonable maximum', () {
      final typography = DisplayTypography.fromScreenWidth(3840);

      // Should scale up but not excessively
      expect(typography.prayerTimeFontSize, lessThanOrEqualTo(50));
      expect(typography.clockFontSize, lessThanOrEqualTo(121));
    });

    test('scale factor is linearly proportional to screen width', () {
      final small = DisplayTypography.fromScreenWidth(1280);
      final medium = DisplayTypography.fromScreenWidth(1920);
      final large = DisplayTypography.fromScreenWidth(3840);

      // Larger screen = larger fonts
      expect(medium.prayerTimeFontSize, greaterThan(small.prayerTimeFontSize));
      expect(large.prayerTimeFontSize, greaterThan(medium.prayerTimeFontSize));
    });
  });

  group('PrayerScheduleRow responsive sizing', () {
    Widget buildTestRow(Size size) {
      final schedule = DailyPrayerSchedule(
        date: DateTime(2026, 9, 2),
        cityName: 'Kota Padang',
        items: [
          PrayerScheduleItem(
            name: PrayerName.subuh,
            timeString: '04:55',
            time: DateTime(2026, 9, 2, 4, 55),
          ),
          PrayerScheduleItem(
            name: PrayerName.dzuhur,
            timeString: '12:20',
            time: DateTime(2026, 9, 2, 12, 20),
          ),
          PrayerScheduleItem(
            name: PrayerName.maghrib,
            timeString: '18:25',
            time: DateTime(2026, 9, 2, 18, 25),
          ),
        ],
      );

      return MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: size.width,
            height: 200,
            child: PrayerScheduleRow(
              schedule: schedule,
              nextPrayer: schedule.items.first,
              nextPrayerCountdown: const Duration(minutes: 30),
            ),
          ),
        ),
      );
    }

    for (final size in const [
      Size(1280, 720),
      Size(1920, 1080),
      Size(3840, 2160),
    ]) {
      testWidgets(
        'renders without overflow at ${size.width.toInt()}x${size.height.toInt()}',
        (tester) async {
          tester.view.physicalSize = size;
          tester.view.devicePixelRatio = 1.0;
          addTearDown(tester.view.reset);

          await tester.pumpWidget(buildTestRow(size));
          await tester.pump();

          expect(tester.takeException(), isNull);
        },
      );
    }

    testWidgets('next prayer card has "SELANJUTNYA" badge', (tester) async {
      tester.view.physicalSize = const Size(1920, 1080);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      final schedule = DailyPrayerSchedule(
        date: DateTime(2026, 9, 2),
        cityName: 'Kota Padang',
        items: [
          PrayerScheduleItem(
            name: PrayerName.subuh,
            timeString: '04:55',
            time: DateTime(2026, 9, 2, 4, 55),
          ),
          PrayerScheduleItem(
            name: PrayerName.dzuhur,
            timeString: '12:20',
            time: DateTime(2026, 9, 2, 12, 20),
          ),
        ],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 1920,
              height: 200,
              child: PrayerScheduleRow(
                schedule: schedule,
                nextPrayer: schedule.items.first,
                nextPrayerCountdown: const Duration(minutes: 30),
              ),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('SELANJUTNYA'), findsOneWidget);
    });
  });
}
