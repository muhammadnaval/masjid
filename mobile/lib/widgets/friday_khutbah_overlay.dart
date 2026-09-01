import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FridayKhutbahOverlay extends StatelessWidget {
  final String title;
  final String message;
  final String? khatibName;
  final String? imamName;
  final String? themeTitle;

  const FridayKhutbahOverlay({
    super.key,
    this.title = "SELAMAT MENUNAIKAN SHALAT JUM'AT",
    this.message = "Harap mendengarkan Khutbah Jum'at dengan khusyuk dan tidak berbicara demi kesempurnaan pahala Jum'at",
    this.khatibName,
    this.imamName,
    this.themeTitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0F172A),
      width: double.infinity,
      height: double.infinity,
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF059669).withOpacity(0.2),
                  border: Border.all(color: const Color(0xFF10B981), width: 3),
                ),
                child: const Icon(
                  Icons.record_voice_over,
                  color: Color(0xFF34D399),
                  size: 64,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                title.isNotEmpty ? title : "SELAMAT MENUNAIKAN SHALAT JUM'AT",
                style: GoogleFonts.outfit(
                  color: const Color(0xFFF59E0B),
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  message,
                  style: GoogleFonts.inter(
                    color: const Color(0xFFE2E8F0),
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              if (khatibName != null || imamName != null || themeTitle != null) ...[
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B).withOpacity(0.8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Column(
                    children: [
                      if (themeTitle != null && themeTitle!.isNotEmpty) ...[
                        Text(
                          "TEMA KHUTBAH",
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF34D399),
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "\"$themeTitle\"",
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (khatibName != null && khatibName!.isNotEmpty) ...[
                            Column(
                              children: [
                                Text(
                                  "KHATIB",
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF94A3B8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  khatibName!,
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFFA7F3D0),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                          if (khatibName != null && imamName != null)
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 24),
                              child: Text("•", style: TextStyle(color: Color(0xFF64748B), fontSize: 20)),
                            ),
                          if (imamName != null && imamName!.isNotEmpty) ...[
                            Column(
                              children: [
                                Text(
                                  "IMAM",
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF94A3B8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  imamName!,
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFFA7F3D0),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
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
  }
}
