import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:hijri/hijri_calendar.dart';
import 'display_typography.dart';

class HeaderBar extends StatelessWidget {
  final DateTime currentTime;
  final String mosqueName;
  final String mosqueAddress;
  final int hijriCorrectionDays;
  final String? logoUrl;
  final Color? primaryColor;
  final Color? secondaryColor;
  final Color? textColor;

  const HeaderBar({
    super.key,
    required this.currentTime,
    this.mosqueName = "MASJID AL-HIDAYAH SITEBA",
    this.mosqueAddress =
        "Jl. Siteba No. 12, Surau Gadang, Nanggalo, Kota Padang",
    this.hijriCorrectionDays = 0,
    this.logoUrl,
    this.primaryColor,
    this.secondaryColor,
    this.textColor,
  });

  String _getFormattedGregorianDate(DateTime dt) {
    const days = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    final dayName = days[dt.weekday % 7];
    final monthName = months[dt.month - 1];
    return "$dayName, ${dt.day} $monthName ${dt.year}";
  }

  String _getFormattedHijriDate(DateTime dt) {
    try {
      final adjustedDt = dt.add(Duration(days: hijriCorrectionDays));
      final hDate = HijriCalendar.fromDate(adjustedDt);
      const hijriMonths = [
        'Muharram',
        'Safar',
        'Rabi\'ul Awal',
        'Rabi\'ul Akhir',
        'Jumadil Awal',
        'Jumadil Akhir',
        'Rajab',
        'Sya\'ban',
        'Ramadhan',
        'Syawwal',
        'Dzulqa\'dah',
        'Dzulhijjah',
      ];
      final monthName = (hDate.hMonth >= 1 && hDate.hMonth <= 12)
          ? hijriMonths[hDate.hMonth - 1]
          : 'Safar';
      return "${hDate.hDay} $monthName ${hDate.hYear} H";
    } catch (_) {
      return "17 Safar 1448 H";
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('HH:mm:ss');
    final formattedTime = timeFormat.format(currentTime);

    final activePrimary = primaryColor ?? const Color(0xFF10B981);
    final activeSecondary = secondaryColor ?? const Color(0xFFF59E0B);
    final activeText = textColor ?? Colors.white;
    final typo = DisplayTypography.fromScreenWidth(
      MediaQuery.of(context).size.width,
    );

    final logo = Container(
      width: typo.headerLogoSize,
      height: typo.headerLogoSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [activePrimary, activePrimary.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: activePrimary.withOpacity(0.4),
            blurRadius: 9,
            spreadRadius: 1.5,
          ),
        ],
      ),
      child:
          logoUrl != null && logoUrl!.isNotEmpty && logoUrl!.startsWith('http')
          ? ClipOval(
              child: Image.network(
                logoUrl!,
                width: typo.headerLogoSize,
                height: typo.headerLogoSize,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Icon(
                  Icons.mosque,
                  color: Colors.white,
                  size: typo.headerLogoSize * 0.58,
                ),
              ),
            )
          : Icon(
              Icons.mosque,
              color: Colors.white,
              size: typo.headerLogoSize * 0.58,
            ),
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withOpacity(0.85),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: activePrimary.withOpacity(0.4), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left: Mosque Branding & Address — scales down as a unit if the
          // enlarged text would overflow the space left by the clock group.
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  logo,
                  const SizedBox(width: 36),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mosqueName,
                        maxLines: 1,
                        style: GoogleFonts.outfit(
                          color: activeText,
                          fontSize: typo.headerNameFontSize,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.location_on,
                            color: activePrimary,
                            size: typo.headerAddressFontSize * 0.8,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            mosqueAddress,
                            maxLines: 1,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF94A3B8),
                              fontSize: typo.headerAddressFontSize,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 24),

          // Right: Digital Clock & Dates — scales down only if the viewport
          // is too narrow to show it at full size.
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Gregorian & Hijri Date Column
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _getFormattedGregorianDate(currentTime),
                        style: GoogleFonts.outfit(
                          color: activeText,
                          fontSize: typo.headerDateFontSize,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: activeSecondary.withOpacity(0.6),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          _getFormattedHijriDate(currentTime),
                          style: GoogleFonts.outfit(
                            color: activeSecondary,
                            fontSize: typo.headerHijriFontSize,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 48),

                  // Digital Clock Box
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 45,
                      vertical: 18,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [activePrimary.withOpacity(0.9), activePrimary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.4),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: activePrimary.withOpacity(0.4),
                          blurRadius: 36,
                        ),
                      ],
                    ),
                    child: Text(
                      formattedTime,
                      style: GoogleFonts.shareTechMono(
                        color: activeText,
                        fontSize: typo.clockFontSize,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
