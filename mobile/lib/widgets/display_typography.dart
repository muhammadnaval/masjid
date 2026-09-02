/// Responsive typography scaling for TV display.
///
/// Base design targets 1920×1080 (1080p landscape TV).
/// Fonts scale linearly with screen width, clamped to reasonable bounds.
class DisplayTypography {
  final double prayerTimeFontSize;
  final double prayerNameFontSize;
  final double nextBadgeFontSize;
  final double countdownFontSize;
  final double iconSize;

  final double panelTitleFontSize;
  final double panelTitleIconSize;
  final double panelNameFontSize;
  final double panelTimeFontSize;
  final double panelRowVerticalPadding;
  final double panelTitleSpacing;

  const DisplayTypography({
    required this.prayerTimeFontSize,
    required this.prayerNameFontSize,
    required this.nextBadgeFontSize,
    required this.countdownFontSize,
    required this.iconSize,
    required this.panelTitleFontSize,
    required this.panelTitleIconSize,
    required this.panelNameFontSize,
    required this.panelTimeFontSize,
    required this.panelRowVerticalPadding,
    required this.panelTitleSpacing,
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
      // Bottom prayer card — readable from 10m
      prayerTimeFontSize: _scale(34, scale),
      prayerNameFontSize: _scale(18, scale),
      nextBadgeFontSize: _scale(12, scale),
      countdownFontSize: _scale(16, scale),
      iconSize: _scale(24, scale),

      // Right panel
      panelTitleFontSize: _scale(20, scale),
      panelTitleIconSize: _scale(22, scale),
      panelNameFontSize: _scale(19, scale),
      panelTimeFontSize: _scale(30, scale),
      panelRowVerticalPadding: _scale(8, scale),
      panelTitleSpacing: _scale(12, scale),
    );
  }

  static double _scale(double base, double factor) =>
      (base * factor).roundToDouble();
}
