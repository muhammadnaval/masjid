import 'display_state.dart';

class PrayerScheduleItem {
  final PrayerName name;
  final String timeString; // e.g. "04:45"
  final DateTime time;
  final bool isIqamahEnabled;
  final int iqamahDurationMinutes;

  PrayerScheduleItem({
    required this.name,
    required this.timeString,
    required this.time,
    this.isIqamahEnabled = true,
    this.iqamahDurationMinutes = 10,
  });
}

class DailyPrayerSchedule {
  final DateTime date;
  final String cityName;
  final List<PrayerScheduleItem> items;

  DailyPrayerSchedule({
    required this.date,
    required this.cityName,
    required this.items,
  });
}
