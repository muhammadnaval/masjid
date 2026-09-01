import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RunningTextBar extends StatefulWidget {
  final String text;
  final Color? primaryColor;
  final Color? backgroundColor;
  final Color? textColor;
  final int speed;

  const RunningTextBar({
    super.key,
    this.text =
        "Selamat Datang di Masjid Al-Hidayah Siteba • Mohon menonaktifkan atau mematikan nada dering Handphone selama berada di dalam area masjid demi menjaga kekhusyukan ibadah • Infaq & Donasi dapat disalurkan melalui Rekening Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah • Kajian Subuh rutin setiap hari Ahad bersama Ustadz Dr. H. Ahmad Fauzi • Jagalah kebersihan & kerapihan shaf shalat bersama",
    this.primaryColor,
    this.backgroundColor,
    this.textColor,
    this.speed = 50,
  });

  @override
  State<RunningTextBar> createState() => _RunningTextBarState();
}

class _RunningTextBarState extends State<RunningTextBar>
    with SingleTickerProviderStateMixin {
  late ScrollController _scrollController;
  bool _animating = true;
  Timer? _restartTimer;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startScrolling();
    });
  }

  @override
  void didUpdateWidget(covariant RunningTextBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.text != oldWidget.text || widget.speed != oldWidget.speed) {
      if (_scrollController.hasClients) _scrollController.jumpTo(0);
    }
  }

  Future<void> _startScrolling() async {
    if (!_animating || !mounted) return;
    if (_scrollController.hasClients) {
      final maxScroll = _scrollController.position.maxScrollExtent;
      if (maxScroll > 0) {
        await _scrollController.animateTo(
          maxScroll,
          duration: Duration(
            milliseconds: (maxScroll / widget.speed.clamp(10, 200) * 1000)
                .round()
                .clamp(1000, 120000),
          ),
          curve: Curves.linear,
        );
        if (mounted && _scrollController.hasClients) {
          _scrollController.jumpTo(0);
        }
      }
    }
    if (_animating && mounted) {
      _restartTimer = Timer(
        const Duration(milliseconds: 200),
        _startScrolling,
      );
    }
  }

  @override
  void dispose() {
    _animating = false;
    _restartTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activePrimary = widget.primaryColor ?? const Color(0xFF10B981);
    final activeBg = widget.backgroundColor ?? const Color(0xFF0F172A);

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: activeBg,
        border: Border(top: BorderSide(color: activePrimary, width: 2)),
      ),
      child: Row(
        children: [
          // Icon & Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: activePrimary,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              children: [
                const Icon(Icons.campaign, color: Colors.white, size: 16),
                const SizedBox(width: 6),
                Text(
                  "INFO",
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),

          // Ticker Text
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  widget.text,
                  style: GoogleFonts.inter(
                    color: widget.textColor ?? const Color(0xFFF1F5F9),
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
