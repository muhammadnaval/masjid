import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/models/display_state.dart';
import 'package:masjid_display/models/prayer_schedule.dart';
import 'package:masjid_display/services/prayer_service.dart';

void main() {
  group('Sprint 2–4 prayer schedule', () {
    test(
      'creates PrayerScheduleItem with prayer name and timeString correctly',
      () {
        final item = PrayerScheduleItem(
          name: PrayerName.subuh,
          timeString: '04:56',
          time: DateTime(2026, 8, 2, 4, 56),
          isIqamahEnabled: true,
          iqamahDurationMinutes: 10,
        );

        expect(item.name, equals(PrayerName.subuh));
        expect(item.timeString, equals('04:56'));
        expect(item.isIqamahEnabled, isTrue);
        expect(item.iqamahDurationMinutes, equals(10));
      },
    );

    test(
      'findPrayerAtTime detects prayer after exact time without using next prayer',
      () {
        final prayerTime = DateTime(2026, 8, 2, 12, 24);
        final schedule = DailyPrayerSchedule(
          date: DateTime(2026, 8, 2),
          cityName: 'Kota Padang',
          items: [
            PrayerScheduleItem(
              name: PrayerName.syuruq,
              timeString: '06:15',
              time: DateTime(2026, 8, 2, 6, 15),
            ),
            PrayerScheduleItem(
              name: PrayerName.dzuhur,
              timeString: '12:24',
              time: prayerTime,
            ),
          ],
        );

        expect(
          PrayerService.findPrayerAtTime(
            schedule,
            prayerTime.add(const Duration(seconds: 3)),
          )?.name,
          PrayerName.dzuhur,
        );
        expect(
          PrayerService.findPrayerAtTime(
            schedule,
            prayerTime.add(const Duration(seconds: 6)),
          ),
          isNull,
        );
        expect(
          PrayerService.findPrayerAtTime(schedule, DateTime(2026, 8, 2, 6, 15)),
          isNull,
        );
      },
    );

    test('modeAfterAdzan follows Friday and iqamah settings', () {
      final time = DateTime(2026, 8, 7, 12, 24);
      final friday = PrayerScheduleItem(
        name: PrayerName.jumat,
        timeString: '12:24',
        time: time,
        isIqamahEnabled: true,
      );
      final subuh = PrayerScheduleItem(
        name: PrayerName.subuh,
        timeString: '05:04',
        time: time,
        isIqamahEnabled: true,
      );
      final disabled = PrayerScheduleItem(
        name: PrayerName.maghrib,
        timeString: '18:28',
        time: time,
        isIqamahEnabled: false,
      );

      expect(PrayerService.modeAfterAdzan(friday), DisplayMode.fridayKhutbah);
      expect(
        PrayerService.modeAfterAdzan(friday, disableFridayIqamah: false),
        DisplayMode.iqamah,
      );
      expect(
        PrayerService.modeAfterAdzan(friday, fridayEnabled: false),
        DisplayMode.iqamah,
      );
      expect(PrayerService.modeAfterAdzan(subuh), DisplayMode.iqamah);
      expect(PrayerService.modeAfterAdzan(disabled), DisplayMode.normal);
    });

    test('syuruq reminder active only during enabled configured window', () {
      final syuruq = DateTime(2026, 8, 2, 6, 20);
      final schedule = DailyPrayerSchedule(
        date: DateTime(2026, 8, 2),
        cityName: 'Kota Padang',
        items: [
          PrayerScheduleItem(
            name: PrayerName.syuruq,
            timeString: '06:20',
            time: syuruq,
          ),
        ],
      );

      expect(
        PrayerService.isSyuruqReminderActive(
          schedule,
          syuruq,
          enabled: true,
          durationMinutes: 15,
        ),
        isTrue,
      );
      expect(
        PrayerService.isSyuruqReminderActive(
          schedule,
          syuruq,
          enabled: false,
          durationMinutes: 15,
        ),
        isFalse,
      );
      expect(
        PrayerService.isSyuruqReminderActive(
          schedule,
          syuruq.add(const Duration(minutes: 15)),
          enabled: true,
          durationMinutes: 15,
        ),
        isFalse,
      );
    });

    test('uses Asia/Jakarta time regardless of device timezone', () {
      final utcThursday = DateTime.utc(2026, 8, 6, 18, 30);

      final masjidTime = PrayerService.masjidTime(utcThursday);

      expect(masjidTime, DateTime(2026, 8, 7, 1, 30));
      expect(masjidTime.weekday, DateTime.friday);
    });

    test('creates DailyPrayerSchedule containing prayer items', () {
      final now = DateTime(2026, 8, 2);
      final items = [
        PrayerScheduleItem(
          name: PrayerName.subuh,
          timeString: '04:56',
          time: now,
        ),
        PrayerScheduleItem(
          name: PrayerName.dzuhur,
          timeString: '12:24',
          time: now,
        ),
        PrayerScheduleItem(
          name: PrayerName.ashar,
          timeString: '15:47',
          time: now,
        ),
        PrayerScheduleItem(
          name: PrayerName.maghrib,
          timeString: '18:28',
          time: now,
        ),
        PrayerScheduleItem(
          name: PrayerName.isya,
          timeString: '19:40',
          time: now,
        ),
      ];

      final schedule = DailyPrayerSchedule(
        date: now,
        cityName: 'Kota Padang',
        items: items,
      );

      expect(schedule.cityName, equals('Kota Padang'));
      expect(schedule.items.length, equals(5));
      expect(schedule.items.first.timeString, equals('04:56'));
    });
  });
}
