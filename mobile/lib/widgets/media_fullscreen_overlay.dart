import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MediaFullscreenOverlay extends StatelessWidget {
  const MediaFullscreenOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      width: double.infinity,
      height: double.infinity,
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.slideshow,
                  color: Color(0xFFA855F7),
                  size: 80,
                ),
                const SizedBox(height: 24),
                Text(
                  "FULLSCREEN MEDIA SLIDE",
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  "Poster Kajian / Video Pengumuman Masjid",
                  style: GoogleFonts.inter(
                    color: const Color(0xFFC084FC),
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFC084FC)),
              ),
              child: Text(
                "PRESS BACK TO EXIT FULLSCREEN",
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
