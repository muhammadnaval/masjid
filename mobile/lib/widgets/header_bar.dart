import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:hijri/hijri_calendar.dart';

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

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left: Mosque Branding & Address
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 45,
                  height: 45,
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
                      logoUrl != null &&
                          logoUrl!.isNotEmpty &&
                          logoUrl!.startsWith('http')
                      ? ClipOval(
                          child: Image.network(
                            logoUrl!,
                            width: 45,
                            height: 45,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.mosque,
                              color: Colors.white,
                              size: 26,
                            ),
                          ),
                        )
                      : const Icon(Icons.mosque, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mosqueName,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                        style: GoogleFonts.outfit(
                          color: activeText,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            color: activePrimary,
                            size: 12,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              mosqueAddress,
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                              style: GoogleFonts.inter(
                                color: const Color(0xFF94A3B8),
                                fontSize: 11,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Right: Digital Clock & Dates
          Row(
            children: [
              // Gregorian & Hijri Date Column
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _getFormattedGregorianDate(currentTime),
                    style: GoogleFonts.outfit(
                      color: activeText,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: activeSecondary.withOpacity(0.6),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      _getFormattedHijriDate(currentTime),
                      style: GoogleFonts.outfit(
                        color: activeSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 18),

              // Digital Clock Box
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 15,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [activePrimary.withOpacity(0.9), activePrimary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.4),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: activePrimary.withOpacity(0.4),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: Text(
                  formattedTime,
                  style: GoogleFonts.shareTechMono(
                    color: activeText,
                    fontSize: 29,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
