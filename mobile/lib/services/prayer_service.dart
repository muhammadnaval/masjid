import '../models/display_state.dart';
import '../models/prayer_schedule.dart';

class PrayerService {
  static DateTime masjidTime(DateTime time) {
    final value = time.toUtc().add(const Duration(hours: 7));
    return DateTime(
      value.year,
      value.month,
      value.day,
      value.hour,
      value.minute,
      value.second,
      value.millisecond,
      value.microsecond,
    );
  }

  static DailyPrayerSchedule getTodaySchedule({
    bool isFriday = false,
    DateTime? referenceTime,
  }) {
    final now = referenceTime ?? DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // Fallback only; normal runtime schedule comes from backend PostgreSQL cache.
    final items = [
      PrayerScheduleItem(
        name: PrayerName.imsak,
        timeString: "04:54",
        time: DateTime(today.year, today.month, today.day, 4, 54),
        isIqamahEnabled: false,
      ),
      PrayerScheduleItem(
        name: PrayerName.subuh,
        timeString: "05:04",
        time: DateTime(today.year, today.month, today.day, 5, 4),
        iqamahDurationMinutes: 10,
      ),
      PrayerScheduleItem(
        name: PrayerName.syuruq,
        timeString: "06:19",
        time: DateTime(today.year, today.month, today.day, 6, 19),
        isIqamahEnabled: false,
      ),
      PrayerScheduleItem(
        name: isFriday ? PrayerName.jumat : PrayerName.dzuhur,
        timeString: "12:28",
        time: DateTime(today.year, today.month, today.day, 12, 28),
        isIqamahEnabled: !isFriday,
        iqamahDurationMinutes: 10,
      ),
      PrayerScheduleItem(
        name: PrayerName.ashar,
        timeString: "15:50",
        time: DateTime(today.year, today.month, today.day, 15, 50),
        iqamahDurationMinutes: 8,
      ),
      PrayerScheduleItem(
        name: PrayerName.maghrib,
        timeString: "18:30",
        time: DateTime(today.year, today.month, today.day, 18, 30),
        iqamahDurationMinutes: 7,
      ),
      PrayerScheduleItem(
        name: PrayerName.isya,
        timeString: "19:42",
        time: DateTime(today.year, today.month, today.day, 19, 42),
        iqamahDurationMinutes: 10,
      ),
    ];

    return DailyPrayerSchedule(
      date: today,
      cityName: "KOTA PADANG",
      items: items,
    );
  }

  static DailyPrayerSchedule applyCorrections(
    DailyPrayerSchedule schedule,
    Map<String, int> corrections,
  ) {
    if (corrections.isEmpty) return schedule;
    final updatedItems = schedule.items.map((item) {
      final key = item.name == PrayerName.jumat
          ? 'dzuhur'
          : item.name.name.toLowerCase();
      final offset = corrections[key] ?? 0;
      if (offset == 0) return item;

      final newTime = item.time.add(Duration(minutes: offset));
      final hours = newTime.hour.toString().padLeft(2, '0');
      final minutes = newTime.minute.toString().padLeft(2, '0');
      return PrayerScheduleItem(
        name: item.name,
        timeString: "$hours:$minutes",
        time: newTime,
        isIqamahEnabled: item.isIqamahEnabled,
        iqamahDurationMinutes: item.iqamahDurationMinutes,
      );
    }).toList();

    return DailyPrayerSchedule(
      date: schedule.date,
      cityName: schedule.cityName,
      items: updatedItems,
    );
  }

  static bool isSyuruqReminderActive(
    DailyPrayerSchedule schedule,
    DateTime now, {
    required bool enabled,
    required int durationMinutes,
  }) {
    if (!enabled) return false;
    final syuruq = schedule.items.where((i) => i.name == PrayerName.syuruq);
    if (syuruq.isEmpty) return false;
    final start = syuruq.first.time;
    final end = start.add(Duration(minutes: durationMinutes));
    return !now.isBefore(start) && now.isBefore(end);
  }

  static PrayerScheduleItem? findPrayerAtTime(
    DailyPrayerSchedule schedule,
    DateTime now, {
    Duration triggerWindow = const Duration(seconds: 5),
  }) {
    for (final item in schedule.items) {
      if (item.name == PrayerName.imsak || item.name == PrayerName.syuruq) {
        continue;
      }
      final elapsed = now.difference(item.time);
      if (!elapsed.isNegative && elapsed <= triggerWindow) return item;
    }
    return null;
  }

  static DisplayMode modeAfterAdzan(
    PrayerScheduleItem? prayer, {
    bool fridayEnabled = true,
    bool disableFridayIqamah = true,
  }) {
    if (prayer?.name == PrayerName.jumat && fridayEnabled) {
      return disableFridayIqamah
          ? DisplayMode.fridayKhutbah
          : DisplayMode.iqamah;
    }
    return prayer?.isIqamahEnabled == true
        ? DisplayMode.iqamah
        : DisplayMode.normal;
  }

  static PrayerScheduleItem? getNextPrayer(
    DailyPrayerSchedule schedule,
    DateTime now,
  ) {
    for (final item in schedule.items) {
      if (item.time.isAfter(now)) {
        return item;
      }
    }
    // If all prayers today passed, return tomorrow's Subuh
    return schedule.items.firstWhere((i) => i.name == PrayerName.subuh);
  }

  static Duration getCountdownToNextPrayer(
    PrayerScheduleItem nextPrayer,
    DateTime now,
  ) {
    if (nextPrayer.time.isAfter(now)) {
      return nextPrayer.time.difference(now);
    } else {
      // Tomorrow's prayer
      final tomorrowTime = nextPrayer.time.add(const Duration(days: 1));
      return tomorrowTime.difference(now);
    }
  }

  static DateTime parseTimeString(DateTime baseDate, String timeStr) {
    try {
      final parts = timeStr.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      return DateTime(
        baseDate.year,
        baseDate.month,
        baseDate.day,
        hour,
        minute,
      );
    } catch (_) {
      return baseDate;
    }
  }

  static String formatDuration(Duration d) {
    final hours = d.inHours.toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return "$hours:$minutes:$seconds";
  }

  /// Resolves the pre-adzan countdown duration (minutes) for [name].
  /// Per-prayer override wins, else settings.defaultMinutes, else 5.
  static int countdownMinutesFor(
    PrayerName name,
    Map<String, dynamic>? settings,
  ) {
    final per = settings?['perPrayer'];
    if (per is Map) {
      final v = per[name.name];
      final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
      if (n != null) return n;
    }
    return (settings?['defaultMinutes'] as num?)?.toInt() ?? 5;
  }
}
