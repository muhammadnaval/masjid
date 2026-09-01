import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/widgets/adzan_overlay.dart';

void main() {
  group('Section 29.7 - Layar Adzan & Audio Playback Widget Tests (TDD)', () {
    testWidgets('renders AdzanOverlay with prayer name and call to prayer text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AdzanOverlay(
            prayerName: 'SUBUH',
            onFinished: () {},
          ),
        ),
      );

      expect(find.text('SAATNYA MASUK WAKTU SHALAT'), findsOneWidget);
      expect(find.text('ADZAN SUBUH'), findsOneWidget);
      expect(find.text("Mari Menunaikan Shalat SUBUH Secara Berjama'ah di Masjid"), findsOneWidget);
      expect(find.text('Memutar Audio Adzan • Layar Adzan Berjalan'), findsOneWidget);
    });

    testWidgets('renders AdzanOverlay for Dzuhur prayer', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AdzanOverlay(
            prayerName: 'DZUHUR',
            onFinished: () {},
          ),
        ),
      );

      expect(find.text('SAATNYA MASUK WAKTU SHALAT'), findsOneWidget);
      expect(find.text('ADZAN DZUHUR'), findsOneWidget);
      expect(find.text("Mari Menunaikan Shalat DZUHUR Secara Berjama'ah di Masjid"), findsOneWidget);
    });
  });
}
