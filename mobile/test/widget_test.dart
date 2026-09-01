import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/main.dart';

void main() {
  testWidgets('MasjidDisplayApp smoke test', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1920, 1080);
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(const MasjidDisplayApp());
    expect(find.text('MASJID AL-HIDAYAH SITEBA'), findsOneWidget);

    // Clean up timers by replacing root widget
    await tester.pumpWidget(const SizedBox());

    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });
}
