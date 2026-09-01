import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SyuruqReminderScreen extends StatelessWidget {
  final int durationMinutes;
  final String displayMessage;
  final VoidCallback? onDismiss;

  const SyuruqReminderScreen({
    super.key,
    this.durationMinutes = 15,
    this.displayMessage =
        "Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha",
    this.onDismiss,
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
              const Color(0xFF451A03).withValues(alpha: 0.96),
              const Color(0xFF78350F).withValues(alpha: 0.96),
              const Color(0xFF451A03).withValues(alpha: 0.96),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
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
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.5),
                    blurRadius: 30,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: const Icon(
                Icons.wb_sunny_rounded,
                color: Colors.white,
                size: 52,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF78350F),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFBBF24)),
              ),
              child: Text(
                "WAKTU SYURUQ (TERBIT MATAHARI)",
                style: GoogleFonts.outfit(
                  color: const Color(0xFFFEF08A),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "Waktu Terlarang Untuk Shalat",
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 44,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 750),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical: 20,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD97706)),
                ),
                child: Column(
                  children: [
                    Text(
                      "\"Ada tiga waktu di mana Rasulullah SAW melarang kami untuk shalat atau menguburkan jenazah di dalamnya: ketika matahari terbit hingga meninggi, ketika matahari tepat di tengah langit, dan ketika matahari hampir tenggelam.\" (HR. Muslim)",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        color: const Color(0xFFFDE68A),
                        fontSize: 16,
                        height: 1.6,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      displayMessage,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SyuruqOverlay extends SyuruqReminderScreen {
  const SyuruqOverlay({
    super.key,
    super.durationMinutes,
    super.displayMessage,
    super.onDismiss,
  });
}
