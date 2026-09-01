import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Fullscreen 5-minute pre-adzan countdown. Large circular progress ring,
/// neon glow, huge MM:SS readable from 3-5m. Final 10s switch to amber and
/// pulse. Shown only while [DisplayMode.normal] so adzan/iqamah naturally
/// override it.
class CountdownOverlay extends StatelessWidget {
  final String prayerName;
  final Duration remaining;
  final Duration total;

  const CountdownOverlay({
    super.key,
    required this.prayerName,
    required this.remaining,
    this.total = const Duration(minutes: 5),
  });

  @override
  Widget build(BuildContext context) {
    final remainingSecs = remaining.inSeconds.clamp(0, total.inSeconds);
    final progress = total.inSeconds == 0 ? 0.0 : remainingSecs / total.inSeconds;
    final isFinal = remainingSecs <= 10 && remainingSecs > 0;
    final accent = isFinal ? const Color(0xFFF59E0B) : const Color(0xFF10B981);
    final accent2 = isFinal ? const Color(0xFFD97706) : const Color(0xFF2DD4BF);

    final m = (remainingSecs ~/ 60).toString().padLeft(2, '0');
    final s = (remainingSecs % 60).toString().padLeft(2, '0');

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFF0B0F17),
              const Color(0xFF0F172A),
              const Color(0xFF0B0F17),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: _Pulsing(
            pulse: isFinal,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // ambient radial glow
                Container(
                  width: 620,
                  height: 620,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        accent.withValues(alpha: 0.18),
                        accent.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
                // progress ring
                SizedBox(
                  width: 560,
                  height: 560,
                  child: CustomPaint(
                    painter: _RingPainter(
                      progress: progress,
                      colorA: accent,
                      colorB: accent2,
                      isFinal: isFinal,
                    ),
                  ),
                ),
                // center content
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 22,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: accent.withValues(alpha: 0.6),
                        ),
                      ),
                      child: Text(
                        'MENUJU WAKTU ADZAN',
                        style: GoogleFonts.outfit(
                          color: accent,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 4,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      '$m:$s',
                      style: GoogleFonts.outfit(
                        fontSize: 220,
                        fontWeight: FontWeight.w800,
                        height: 1.0,
                        letterSpacing: -2,
                        foreground: Paint()
                          ..shader = LinearGradient(
                            colors: [Colors.white, accent2],
                          ).createShader(
                            const Rect.fromLTWH(0, 0, 460, 220),
                          ),
                        shadows: [
                          Shadow(
                            color: accent.withValues(alpha: 0.9),
                            blurRadius: 40,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      prayerName,
                      style: GoogleFonts.outfit(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 56,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 6,
                        shadows: [
                          Shadow(
                            color: accent.withValues(alpha: 0.6),
                            blurRadius: 24,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      isFinal ? 'BERSIAP — ADZAN SEGERA' : 'SEGERA LAKUKAN SHALAT',
                      style: GoogleFonts.inter(
                        color: Colors.white.withValues(alpha: 0.55),
                        fontSize: 22,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Pulsing extends StatefulWidget {
  final bool pulse;
  final Widget child;
  const _Pulsing({required this.pulse, required this.child});

  @override
  State<_Pulsing> createState() => _PulsingState();
}

class _PulsingState extends State<_Pulsing>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _s;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _s = Tween(begin: 1.0, end: 1.04).animate(
      CurvedAnimation(parent: _c, curve: Curves.easeInOut),
    );
    if (widget.pulse) _c.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant _Pulsing old) {
    super.didUpdateWidget(old);
    if (widget.pulse && !old.pulse) {
      _c.repeat(reverse: true);
    } else if (!widget.pulse && old.pulse) {
      _c.stop();
      _c.value = 1.0;
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.pulse) return widget.child;
    return ScaleTransition(scale: _s, child: widget.child);
  }
}

class _RingPainter extends CustomPainter {
  final double progress; // 1.0 = full remaining, 0.0 = done
  final Color colorA;
  final Color colorB;
  final bool isFinal;

  _RingPainter({
    required this.progress,
    required this.colorA,
    required this.colorB,
    required this.isFinal,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) / 2) - 22;
    const startAngle = -math.pi / 2; // top
    final sweep = 2 * math.pi * progress;

    // track
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14
        ..color = Colors.white.withValues(alpha: 0.06),
    );

    // tick marks every 6° for a refined "clock" feel
    final tick = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = Colors.white.withValues(alpha: 0.10);
    for (var i = 0; i < 60; i++) {
      final a = startAngle + (2 * math.pi * i / 60);
      final inner = radius - 10;
      final outer = radius + 10;
      canvas.drawLine(
        Offset(
          center.dx + inner * math.cos(a),
          center.dy + inner * math.sin(a),
        ),
        Offset(
          center.dx + outer * math.cos(a),
          center.dy + outer * math.sin(a),
        ),
        tick,
      );
    }

    // glowing progress arc
    final rect = Rect.fromCircle(center: center, radius: radius);
    final shader = SweepGradient(
      startAngle: startAngle,
      endAngle: startAngle + 2 * math.pi,
      colors: [colorA, colorB, colorA],
      stops: const [0.0, 0.5, 1.0],
      transform: GradientRotation(startAngle),
    ).createShader(rect);

    final glow = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 18
      ..strokeCap = StrokeCap.round
      ..shader = shader
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18);
    canvas.drawArc(rect, startAngle, sweep, false, glow);

    final main = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..shader = shader;
    canvas.drawArc(rect, startAngle, sweep, false, main);

    // leading dot
    if (progress > 0.001) {
      final head = Offset(
        center.dx + radius * math.cos(startAngle + sweep),
        center.dy + radius * math.sin(startAngle + sweep),
      );
      canvas.drawCircle(
        head,
        isFinal ? 14 : 10,
        Paint()
          ..color = colorB
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12),
      );
      canvas.drawCircle(head, isFinal ? 7 : 5, Paint()..color = Colors.white);
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) =>
      old.progress != progress ||
      old.colorA != colorA ||
      old.isFinal != isFinal;
}
