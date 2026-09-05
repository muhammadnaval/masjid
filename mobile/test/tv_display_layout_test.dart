import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/main.dart';

void main() {
  group('Sprint 9 responsive TV', () {
    for (final size in const [
      Size(1280, 720),
      Size(1920, 1080),
      Size(3840, 2160),
    ]) {
      testWidgets('renders without layout errors at ${size.width.toInt()}x${size.height.toInt()}', (
        tester,
      ) async {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(
          const MaterialApp(home: TVDisplayScreen(displayState: {})),
        );
        await tester.pump();

        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      });
    }
  });

  group('Section 29.5 - Display Utama TV (Layout 16:9) Widget Tests (TDD)', () {
    testWidgets('renders 16:9 main layout with prayer cards and header elements', (WidgetTester tester) async {
      // Set 16:9 TV resolution (1920x1080)
      tester.view.physicalSize = const Size(1920, 1080);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(const MasjidDisplayApp());
      await tester.pump();

      // Verify Mosque header text
      expect(find.text('MASJID AL-HIDAYAH SITEBA'), findsOneWidget);

      // Verify prayer time slots present in widget tree
      // (Imsak is intentionally hidden from the bottom prayer row)
      expect(find.text('IMSAK'), findsNothing);
      expect(find.text('SUBUH'), findsAtLeastNWidgets(1));
      expect(find.text('SYURUQ'), findsAtLeastNWidgets(1));
      expect(find.text('DZUHUR'), findsAtLeastNWidgets(1));
      expect(find.text('ASHAR'), findsAtLeastNWidgets(1));
      expect(find.text('MAGHRIB'), findsAtLeastNWidgets(1));
      expect(find.text('ISYA'), findsAtLeastNWidgets(1));

      // Reset physical size
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });
  });
}
