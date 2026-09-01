import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AdzanOverlay extends StatelessWidget {
  final String prayerName;
  final String? displayMessage;
  final VoidCallback? onFinished;

  const AdzanOverlay({
    super.key,
    required this.prayerName,
    this.displayMessage,
    this.onFinished,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFF022C22).withOpacity(0.96),
              const Color(0xFF064E3B).withOpacity(0.96),
              const Color(0xFF022C22).withOpacity(0.96),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Background Glow Circles
            Positioned(
              child: Container(
                width: 450,
                height: 450,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF10B981).withOpacity(0.12),
                ),
              ),
            ),

            // Main Content Box
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Top Icon
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFF59E0B).withOpacity(0.5),
                        blurRadius: 30,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.volume_up_rounded,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 24),

                // Subtitle Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF065F46),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF34D399)),
                  ),
                  child: Text(
                    "SAATNYA MASUK WAKTU SHALAT",
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFA7F3D0),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Main Title
                Text(
                  "ADZAN $prayerName",
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 54,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    shadows: [
                      Shadow(
                        color: const Color(0xFF10B981).withOpacity(0.8),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Call to Prayer Subtext
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    displayMessage != null && displayMessage!.trim().isNotEmpty
                        ? displayMessage!
                        : "Mari Menunaikan Shalat $prayerName Secara Berjama'ah di Masjid",
                    style: GoogleFonts.inter(
                      color: const Color(0xFFCBD5E1),
                      fontSize: 20,
                      fontWeight: FontWeight.w400,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 32),

                // Simulated Audio Indicator
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: const Color(0xFF059669)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: Color(0xFF34D399),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        "Memutar Audio Adzan • Layar Adzan Berjalan",
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF34D399),
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
