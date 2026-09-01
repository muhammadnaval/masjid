import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/widgets/iqamah_overlay.dart';

void main() {
  group('Section 29.8 - Countdown Iqamah Widget Tests (TDD)', () {
    testWidgets('renders IqamahOverlay with prayer name and etiquette notice', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: IqamahOverlay(
            prayerName: 'SUBUH',
            totalMinutes: 10,
            onFinished: () {},
          ),
        ),
      );

      expect(find.text('MENUNJU IQAMAH SUBUH'), findsOneWidget);
      expect(find.text('Matikan HP'), findsOneWidget);
      expect(find.text('Rapatkan Shaf'), findsOneWidget);
      expect(find.text('Jaga Ketenangan'), findsOneWidget);
    });

    testWidgets('triggers onFinished callback when timer countdown reaches 0', (WidgetTester tester) async {
      bool finishedCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: IqamahOverlay(
            prayerName: 'DZUHUR',
            totalMinutes: 1, // 1 minute countdown
            onFinished: () {
              finishedCalled = true;
            },
          ),
        ),
      );

      expect(find.text('MENUNJU IQAMAH DZUHUR'), findsOneWidget);

      // Fast forward 61 seconds
      await tester.pump(const Duration(seconds: 61));
      expect(finishedCalled, isTrue);
    });
  });
}
