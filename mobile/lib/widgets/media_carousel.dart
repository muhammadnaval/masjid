import 'dart:async';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/media_slide.dart';
import 'youtube_player_widget.dart';
import 'video_player_widget.dart';

class MediaCarousel extends StatefulWidget {
  final List<MediaSlideItem>? items;
  final bool isPaused;

  const MediaCarousel({super.key, this.items, this.isPaused = false});

  @override
  State<MediaCarousel> createState() => _MediaCarouselState();
}

class _MediaCarouselState extends State<MediaCarousel> {
  int _currentIndex = 0;
  Timer? _timer;

  static final List<MediaSlideItem> _defaultSlides = [
    MediaSlideItem(
      id: '1',
      title: 'SELAMAT DATANG DI MASJID AL-HIDAYAH',
      subtitle: 'Mari Menjaga Kesucian dan Kekhusyukan di Rumah Allah',
      type: SlideType.welcome,
      durationSeconds: 8,
    ),
    MediaSlideItem(
      id: '3',
      title: 'AGENDA KAJIAN RUTIN SUBUH',
      subtitle: 'Setiap Hari Ahad Pekan Pertama & Ketiga',
      type: SlideType.announcement,
      translationText:
          'Pemateri: Ustadz Dr. H. Ahmad Fauzi, Lc., MA\nTema: Tazkiyatun Nufs & Fiqih Muamalah',
      durationSeconds: 8,
    ),
    MediaSlideItem(
      id: '4',
      title: 'LAPORAN KAS MASJID PEKAN INI',
      type: SlideType.kasTable,
      tableData: {
        'Saldo Awal': 'Rp 14.500.000',
        'Infaq Jumat': 'Rp 5.230.000',
        'Pengeluaran Operasional': 'Rp 2.100.000',
        'Saldo Akhir': 'Rp 17.630.000',
      },
      durationSeconds: 8,
    ),
  ];

  List<MediaSlideItem> get _slides {
    if (widget.items != null && widget.items!.isNotEmpty) {
      return widget.items!;
    }
    return _defaultSlides;
  }

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _advanceToNextSlide() {
    if (!mounted) return;
    _timer?.cancel();
    setState(() {
      final activeSlides = _slides;
      if (activeSlides.isNotEmpty) {
        _currentIndex = (_currentIndex + 1) % activeSlides.length;
      }
    });
    _startTimer();
  }

  @override
  void didUpdateWidget(covariant MediaCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    final sequenceChanged = !_sameSlideSequence(widget.items, oldWidget.items);
    if (sequenceChanged && _currentIndex >= _slides.length) {
      _currentIndex = 0;
    }
    if (widget.isPaused) {
      _timer?.cancel();
    } else if (oldWidget.isPaused || sequenceChanged) {
      _startTimer();
    }
  }

  bool _sameSlideSequence(
    List<MediaSlideItem>? current,
    List<MediaSlideItem>? previous,
  ) {
    if (identical(current, previous)) return true;
    if (current == null || previous == null) return current == previous;
    if (current.length != previous.length) return false;
    for (var i = 0; i < current.length; i++) {
      final a = current[i];
      final b = previous[i];
      if (a.id != b.id ||
          a.type != b.type ||
          a.durationSeconds != b.durationSeconds ||
          a.title != b.title ||
          a.subtitle != b.subtitle ||
          a.imagePath != b.imagePath) {
        return false;
      }
    }
    return true;
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.isPaused) return;
    final slides = _slides;
    if (slides.isEmpty) return;
    if (_currentIndex >= slides.length) {
      _currentIndex = 0;
    }

    final currentSlide = slides[_currentIndex];
    final isVideo =
        currentSlide.type == SlideType.video ||
        currentSlide.type == SlideType.youtube ||
        currentSlide.type == SlideType.livestream;

    if (isVideo) {
      // For video slides, wait until video finishes (with a safety duration timeout)
      final safetySeconds = currentSlide.durationSeconds > 15
          ? currentSlide.durationSeconds
          : 90;
      _timer = Timer(Duration(seconds: safetySeconds), () {
        _advanceToNextSlide();
      });
    } else {
      // For static slides, rotate after durationSeconds
      _timer = Timer(Duration(seconds: currentSlide.durationSeconds), () {
        _advanceToNextSlide();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slide = _slides[_currentIndex];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF334155).withValues(alpha: 0.6),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 16),
        ],
      ),
      child: Column(
        children: [
          // Slide Content View with AnimatedSwitcher
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 600),
              child: KeyedSubtree(
                key: ValueKey<int>(_currentIndex),
                child: _buildSlideContent(slide),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Page Indicator Dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_slides.length, (index) {
              final isActive = index == _currentIndex;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: isActive ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: isActive
                      ? const Color(0xFF10B981)
                      : const Color(0xFF475569),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildSlideContent(MediaSlideItem slide) {
    switch (slide.type) {
      case SlideType.hadith:
      case SlideType.dakwahText:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF065F46),
                borderRadius: BorderRadius.circular(20),
              ),
              child: _fittedAutoSizeText(
                slide.title,
                style: GoogleFonts.outfit(
                  color: const Color(0xFFA7F3D0),
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
                maxLines: 1,
                minFontSize: 9,
              ),
            ),
            if (slide.arabicText?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              _arabicText(slide.arabicText!),
            ],
            if (slide.subtitle?.isNotEmpty == true) ...[
              const SizedBox(height: 10),
              _descriptionText(slide.subtitle!),
            ],
            if (slide.description?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              _descriptionText(slide.description!),
            ],
            const SizedBox(height: 16),
          ],
        );

      case SlideType.infoTable:
      case SlideType.kasTable:
        final hasHeaders =
            slide.tableHeaders != null && slide.tableHeaders!.isNotEmpty;
        final hasRows = slide.tableRows != null && slide.tableRows!.isNotEmpty;

        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _fittedAutoSizeText(
              slide.title,
              style: GoogleFonts.outfit(
                color: const Color(0xFF38BDF8),
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
              maxLines: 2,
              minFontSize: 12,
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Container(
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF334155)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: hasHeaders && hasRows
                    ? Table(
                        columnWidths: const {
                          0: FlexColumnWidth(1.2),
                          1: FlexColumnWidth(1.5),
                          2: FlexColumnWidth(1.8),
                        },
                        children: [
                          // Table Header
                          TableRow(
                            decoration: const BoxDecoration(
                              color: Color(0xFF065F46),
                            ),
                            children: slide.tableHeaders!.map((h) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                child: _fittedAutoSizeText(
                                  h,
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFFA7F3D0),
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 2,
                                  minFontSize: 9,
                                ),
                              );
                            }).toList(),
                          ),
                          // Table Rows
                          ...slide.tableRows!.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final row = entry.value;
                            final isEven = idx % 2 == 0;
                            final isLast = idx == slide.tableRows!.length - 1;

                            return TableRow(
                              decoration: BoxDecoration(
                                color: isEven
                                    ? Colors.transparent
                                    : const Color(
                                        0xFF1E293B,
                                      ).withValues(alpha: 0.5),
                                border: Border(
                                  bottom: BorderSide(
                                    color: const Color(
                                      0xFF334155,
                                    ).withValues(alpha: 0.4),
                                    width: isLast ? 0 : 1,
                                  ),
                                ),
                              ),
                              children: row.map((cell) {
                                return Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 10,
                                  ),
                                  child: _fittedAutoSizeText(
                                    cell,
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFFE2E8F0),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 2,
                                    minFontSize: 9,
                                  ),
                                );
                              }).toList(),
                            );
                          }),
                        ],
                      )
                    : Column(
                        children: (slide.tableData ?? {}).entries.map((entry) {
                          final isLast =
                              entry.key.toLowerCase().contains('akhir') ||
                              entry.key.toLowerCase().contains('total');
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: isLast
                                  ? const Color(0xFF064E3B)
                                  : Colors.transparent,
                              border: Border(
                                bottom: BorderSide(
                                  color: const Color(
                                    0xFF334155,
                                  ).withValues(alpha: 0.5),
                                  width: isLast ? 0 : 1,
                                ),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: _fittedAutoSizeText(
                                    entry.key,
                                    textAlign: TextAlign.left,
                                    style: GoogleFonts.outfit(
                                      color: isLast
                                          ? const Color(0xFFA7F3D0)
                                          : const Color(0xFFCBD5E1),
                                      fontSize: 16,
                                      fontWeight: isLast
                                          ? FontWeight.bold
                                          : FontWeight.w500,
                                    ),
                                    maxLines: 1,
                                    minFontSize: 9,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _fittedAutoSizeText(
                                    entry.value.toString(),
                                    textAlign: TextAlign.right,
                                    style: GoogleFonts.shareTechMono(
                                      color: isLast
                                          ? const Color(0xFF34D399)
                                          : Colors.white,
                                      fontSize: 17,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    minFontSize: 9,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
              ),
            ),
          ],
        );

      case SlideType.donation:
        final hasQr = slide.imagePath != null && slide.imagePath!.isNotEmpty;
        final accountText = slide.arabicText?.trim().isNotEmpty == true
            ? slide.arabicText!
            : "Bank Nagari • 1002.0210.09881-1\na.n Masjid Al-Hidayah Siteba";
        final descriptionText = slide.subtitle?.trim().isNotEmpty == true
            ? slide.subtitle!
            : "Pindai QRIS via Mobile Banking / E-Wallet";
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.qr_code_2_rounded,
                  color: Color(0xFFF59E0B),
                  size: 32,
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: _fittedAutoSizeText(
                    slide.title.isNotEmpty
                        ? slide.title
                        : "INFAQ & DONASI MASJID",
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFF59E0B),
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                    maxLines: 1,
                    minFontSize: 11,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // QR Image Box
                if (hasQr) ...[
                  Container(
                    width: 170,
                    height: 170,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFFF59E0B,
                          ).withValues(alpha: 0.25),
                          blurRadius: 15,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Image.network(
                      slide.imagePath!,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.qr_code_2,
                        size: 100,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  const SizedBox(width: 24),
                ],

                // Account & Bank Details Box
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _fittedAutoSizeText(
                          "TRANSFER BANK & QRIS",
                          textAlign: TextAlign.left,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF34D399),
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                          maxLines: 1,
                          minFontSize: 9,
                        ),
                        const SizedBox(height: 8),
                        _fittedAutoSizeText(
                          accountText,
                          textAlign: TextAlign.left,
                          style: GoogleFonts.shareTechMono(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          minFontSize: 9,
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF065F46),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: _fittedAutoSizeText(
                            descriptionText,
                            style: GoogleFonts.outfit(
                              color: const Color(0xFFA7F3D0),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            minFontSize: 8,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        );

      case SlideType.announcement:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.campaign, color: const Color(0xFFF59E0B), size: 40),
            const SizedBox(height: 10),
            _fittedAutoSizeText(
              slide.title,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 2,
              minFontSize: 12,
            ),
            if (slide.description?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              _descriptionText(slide.description!),
            ],
            const SizedBox(height: 12),
          ],
        );

      case SlideType.video:
        final videoUrl =
            slide.imagePath ?? slide.translationText ?? slide.subtitle ?? '';
        return LocalVideoPlayerWidget(
          videoUrl: videoUrl,
          title: slide.title,
          subtitle: slide.subtitle,
          onVideoEnded: _advanceToNextSlide,
        );

      case SlideType.image:
        final hasUrl = slide.imagePath != null && slide.imagePath!.isNotEmpty;
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (slide.title.isNotEmpty) ...[
              _fittedAutoSizeText(
                slide.title,
                style: GoogleFonts.outfit(
                  color: const Color(0xFF38BDF8),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                minFontSize: 10,
              ),
              const SizedBox(height: 8),
            ],
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: hasUrl && slide.imagePath!.startsWith('http')
                    ? Image.network(
                        slide.imagePath!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => Container(
                          color: const Color(0xFF1E293B),
                          alignment: Alignment.center,
                          child: _fittedAutoSizeText(
                            slide.title,
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 18,
                            ),
                            maxLines: 2,
                            minFontSize: 10,
                          ),
                        ),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF334155)),
                        ),
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.image_rounded,
                              color: Color(0xFF38BDF8),
                              size: 48,
                            ),
                            const SizedBox(height: 12),
                            _fittedAutoSizeText(
                              slide.title,
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 2,
                              minFontSize: 10,
                            ),
                          ],
                        ),
                      ),
              ),
            ),
            if (slide.description?.isNotEmpty == true) ...[
              const SizedBox(height: 10),
              _descriptionText(slide.description!),
            ],
          ],
        );

      case SlideType.youtube:
      case SlideType.livestream:
        final youtubeUrl =
            slide.imagePath ?? slide.translationText ?? slide.subtitle ?? '';
        return YouTubePlayerWidget(
          videoUrl: youtubeUrl,
          title: slide.title,
          subtitle: slide.subtitle,
          onVideoEnded: _advanceToNextSlide,
          isLive: slide.type == SlideType.livestream,
        );

      case SlideType.welcome:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.star_half, color: Color(0xFF10B981), size: 44),
            const SizedBox(height: 12),
            _fittedAutoSizeText(
              slide.title,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
              maxLines: 2,
              minFontSize: 12,
            ),
            const SizedBox(height: 10),
          ],
        );
    }
  }

  Widget _fittedAutoSizeText(
    String text, {
    required TextStyle style,
    int maxLines = 1,
    double minFontSize = 10,
    TextAlign textAlign = TextAlign.center,
    TextDirection? textDirection,
  }) => LayoutBuilder(
    builder: (context, constraints) {
      final width = constraints.maxWidth.isFinite
          ? constraints.maxWidth
          : 760.0;
      return FittedBox(
        fit: BoxFit.scaleDown,
        child: SizedBox(
          width: width,
          child: AutoSizeText(
            text,
            textAlign: textAlign,
            maxLines: maxLines,
            minFontSize: minFontSize,
            overflow: TextOverflow.ellipsis,
            textDirection: textDirection,
            style: style,
          ),
        ),
      );
    },
  );

  Widget _arabicText(String text) => ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 760),
    child: _fittedAutoSizeText(
      text,
      maxLines: 4,
      minFontSize: 14,
      textDirection: TextDirection.rtl,
      style: GoogleFonts.amiri(
        color: Colors.white,
        fontSize: 26,
        height: 1.7,
        fontWeight: FontWeight.bold,
      ),
    ),
  );

  Widget _descriptionText(String text) => ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 760),
    child: _fittedAutoSizeText(
      text,
      maxLines: 5,
      minFontSize: 10,
      style: GoogleFonts.inter(
        color: const Color(0xFFE2E8F0),
        fontSize: 16,
        height: 1.4,
      ),
    ),
  );
}
