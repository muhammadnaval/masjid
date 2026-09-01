import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/widgets/syuruq_overlay.dart';

void main() {
  group('Section 29.9 - Syuruq Overlay Widget Tests (TDD)', () {
    testWidgets('renders SyuruqOverlay header title and Hadith text', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: SyuruqOverlay(
            durationMinutes: 15,
            displayMessage: 'Waktu terlarang shalat saat matahari terbit',
            onDismiss: () {},
          ),
        ),
      );

      expect(find.text('WAKTU SYURUQ (TERBIT MATAHARI)'), findsOneWidget);
      expect(find.text('Waktu Terlarang Untuk Shalat'), findsOneWidget);
      expect(
        find.text('Waktu terlarang shalat saat matahari terbit'),
        findsOneWidget,
      );
      expect(find.textContaining('HR. Muslim'), findsOneWidget);
    });

    testWidgets('renders dismiss action button when onDismiss provided', (
      WidgetTester tester,
    ) async {
      bool dismissed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: SyuruqOverlay(
            durationMinutes: 15,
            displayMessage: 'Testing Syuruq',
            onDismiss: () {
              dismissed = true;
            },
          ),
        ),
      );

      expect(find.text('WAKTU SYURUQ (TERBIT MATAHARI)'), findsOneWidget);
      expect(dismissed, isFalse);
    });
  });
}
