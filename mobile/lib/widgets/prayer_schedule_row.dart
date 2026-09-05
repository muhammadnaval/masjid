import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/display_state.dart';
import '../models/prayer_schedule.dart';
import '../services/prayer_service.dart';
import 'display_typography.dart';

class PrayerScheduleRow extends StatelessWidget {
  final DailyPrayerSchedule schedule;
  final PrayerScheduleItem? nextPrayer;
  final Duration nextPrayerCountdown;
  final Color? primaryColor;
  final Color? secondaryColor;
  final Color? textColor;

  const PrayerScheduleRow({
    super.key,
    required this.schedule,
    required this.nextPrayer,
    required this.nextPrayerCountdown,
    this.primaryColor,
    this.secondaryColor,
    this.textColor,
  });

  IconData _getPrayerIcon(PrayerName name) {
    switch (name) {
      case PrayerName.imsak:
        return Icons.wb_twilight;
      case PrayerName.subuh:
        return Icons.wb_sunny_outlined;
      case PrayerName.syuruq:
        return Icons.wb_sunny;
      case PrayerName.dzuhur:
      case PrayerName.jumat:
        return Icons.wb_sunny_rounded;
      case PrayerName.ashar:
        return Icons.wb_cloudy_outlined;
      case PrayerName.maghrib:
        return Icons.nights_stay_outlined;
      case PrayerName.isya:
        return Icons.dark_mode;
    }
  }

  @override
  Widget build(BuildContext context) {
    final activePrimary = primaryColor ?? const Color(0xFF38BDF8);
    final activeSecondary = secondaryColor ?? const Color(0xFFD97706);
    final activeText = textColor ?? Colors.white;
    final screenW = MediaQuery.of(context).size.width;
    final typo = DisplayTypography.fromScreenWidth(screenW);

    return Row(
      children: schedule.items.map((item) {
        final isNext = (nextPrayer?.name == item.name);

        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
            decoration: BoxDecoration(
              gradient: isNext
                  ? LinearGradient(
                      colors: [
                        activeSecondary,
                        activeSecondary.withOpacity(0.8),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    )
                  : LinearGradient(
                      colors: [
                        const Color(0xFF1E293B).withOpacity(0.9),
                        const Color(0xFF0F172A).withOpacity(0.9),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isNext
                    ? Colors.white
                    : const Color(0xFF334155).withOpacity(0.6),
                width: isNext ? 3 : 1,
              ),
              boxShadow: isNext
                  ? [
                      BoxShadow(
                        color: activeSecondary.withOpacity(0.6),
                        blurRadius: 18,
                        spreadRadius: 2,
                      ),
                    ]
                  : [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 6,
                      ),
                    ],
            ),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Highlight Tag if Next
                  if (isNext)
                    Container(
                      margin: const EdgeInsets.only(bottom: 4),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        "SELANJUTNYA",
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: typo.nextBadgeFontSize,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),

                  // Icon
                  Icon(
                    _getPrayerIcon(item.name),
                    color: isNext ? Colors.white : activePrimary,
                    size: typo.iconSize,
                  ),
                  const SizedBox(height: 6),

                  // Prayer Name
                  Text(
                    item.name.displayName,
                    style: GoogleFonts.outfit(
                      color: isNext ? activeText : activeText.withOpacity(0.85),
                      fontSize: typo.prayerNameFontSize,
                      fontWeight: isNext ? FontWeight.bold : FontWeight.w600,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Prayer Time
                  Text(
                    item.timeString,
                    style: GoogleFonts.shareTechMono(
                      color: activeText,
                      fontSize: typo.prayerTimeFontSize,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  // Countdown Timer under Next Prayer
                  if (isNext) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer,
                            color: const Color(0xFFFEF08A),
                            size: typo.countdownFontSize,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            PrayerService.formatDuration(nextPrayerCountdown),
                            style: GoogleFonts.shareTechMono(
                              color: const Color(0xFFFEF08A),
                              fontSize: typo.countdownFontSize,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
