import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/widgets/friday_khutbah_overlay.dart';

void main() {
  testWidgets('renders configured Friday khutbah content', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: FridayKhutbahOverlay(
          title: 'SHALAT JUMAT',
          message: 'Dengarkan khutbah',
          khatibName: 'Ustaz Ahmad',
          imamName: 'Ustaz Ali',
          themeTitle: 'Menjaga Amanah',
        ),
      ),
    );

    expect(find.text('SHALAT JUMAT'), findsOneWidget);
    expect(find.text('Dengarkan khutbah'), findsOneWidget);
    expect(find.text('Ustaz Ahmad'), findsOneWidget);
    expect(find.text('Ustaz Ali'), findsOneWidget);
    expect(find.text('"Menjaga Amanah"'), findsOneWidget);
  });
}
