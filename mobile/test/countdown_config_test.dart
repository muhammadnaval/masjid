import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/models/display_state.dart';
import 'package:masjid_display/services/prayer_service.dart';

void main() {
  group('PrayerService.countdownMinutesFor', () {
    test('per-prayer override wins', () {
      final s = <String, dynamic>{
        'defaultMinutes': 5,
        'perPrayer': {'subuh': 7, 'jumat': 10},
      };
      expect(PrayerService.countdownMinutesFor(PrayerName.subuh, s), 7);
      expect(PrayerService.countdownMinutesFor(PrayerName.jumat, s), 10);
      expect(PrayerService.countdownMinutesFor(PrayerName.dzuhur, s), 5);
    });

    test('falls back to defaultMinutes when no override', () {
      const s = <String, dynamic>{'defaultMinutes': 8, 'perPrayer': {}};
      expect(PrayerService.countdownMinutesFor(PrayerName.ashar, s), 8);
    });

    test('null settings -> 5', () {
      expect(PrayerService.countdownMinutesFor(PrayerName.maghrib, null), 5);
    });

    test('string-encoded override value parsed', () {
      final s = <String, dynamic>{
        'defaultMinutes': 5,
        'perPrayer': {'isya': '12'},
      };
      expect(PrayerService.countdownMinutesFor(PrayerName.isya, s), 12);
    });

    test('malformed override falls back to default', () {
      final s = <String, dynamic>{
        'defaultMinutes': 6,
        'perPrayer': {'subuh': 'abc'},
      };
      expect(PrayerService.countdownMinutesFor(PrayerName.subuh, s), 6);
    });
  });
}
