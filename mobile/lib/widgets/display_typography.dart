/// Responsive typography scaling for TV display.
///
/// Design baselines (at 1920px / 1080p) target readability from 10 meters:
/// clock and prayer times are enlarged ~3x relative to the original design.
class DisplayTypography {
  // --- Header bar ---
  final double headerNameFontSize;
  final double headerAddressFontSize;
  final double headerLogoSize;
  final double headerDateFontSize;
  final double headerHijriFontSize;
  final double clockFontSize;

  // --- Bottom prayer card row ---
  final double prayerTimeFontSize;
  final double prayerNameFontSize;
  final double nextBadgeFontSize;
  final double countdownFontSize;
  final double iconSize;

  const DisplayTypography({
    required this.headerNameFontSize,
    required this.headerAddressFontSize,
    required this.headerLogoSize,
    required this.headerDateFontSize,
    required this.headerHijriFontSize,
    required this.clockFontSize,
    required this.prayerTimeFontSize,
    required this.prayerNameFontSize,
    required this.nextBadgeFontSize,
    required this.countdownFontSize,
    required this.iconSize,
  });

  /// Design baseline: 1920px width.
  static const double _baseWidth = 1920;

  /// Clamping bounds — prevent extreme sizes.
  static const double _minScale = 0.65;
  static const double _maxScale = 1.38;

  factory DisplayTypography.fromScreenWidth(double width) {
    final rawScale = width / _baseWidth;
    final scale = rawScale.clamp(_minScale, _maxScale);

    return DisplayTypography(
      // Header — ~3x original sizes (20/11/45/13/11/29)
      headerNameFontSize: _scale(60, scale),
      headerAddressFontSize: _scale(33, scale),
      headerLogoSize: _scale(135, scale),
      headerDateFontSize: _scale(39, scale),
      headerHijriFontSize: _scale(33, scale),
      clockFontSize: _scale(87, scale),

      // Bottom prayer card — ~3x original sizes (12/9/6/8/15)
      prayerTimeFontSize: _scale(36, scale),
      prayerNameFontSize: _scale(27, scale),
      nextBadgeFontSize: _scale(18, scale),
      countdownFontSize: _scale(24, scale),
      iconSize: _scale(45, scale),
    );
  }

  static double _scale(double base, double factor) =>
      (base * factor).roundToDouble();
}
