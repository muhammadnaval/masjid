import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/models/media_slide.dart';
import 'package:masjid_display/widgets/media_carousel.dart';

void main() {
  testWidgets(
    'slide advances after its duration even when the API poll delivers an identical-content list',
    (tester) async {
      // The display-state poll rebuilds the items list every 10s; a fresh
      // instance with the same ids/durations must NOT reset the slide timer.
      List<MediaSlideItem> buildItems() => [
        MediaSlideItem(
          id: '1',
          title: 'SLIDE A',
          type: SlideType.welcome,
          durationSeconds: 20,
        ),
        MediaSlideItem(
          id: '2',
          title: 'SLIDE B',
          type: SlideType.welcome,
          durationSeconds: 20,
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: MediaCarousel(items: buildItems())),
        ),
      );
      expect(find.text('SLIDE A'), findsOneWidget);

      // t=10s: poll arrives with a new list instance, same content.
      await tester.pump(const Duration(seconds: 10));
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: MediaCarousel(items: buildItems())),
        ),
      );

      // t=21s total — the 20s timer must have fired despite the refresh.
      await tester.pump(const Duration(seconds: 11));
      expect(find.text('SLIDE B'), findsOneWidget);
    },
  );

  testWidgets('timer restarts when the slide sequence genuinely changes', (
    tester,
  ) async {
    List<MediaSlideItem> buildItems({required int duration}) => [
      MediaSlideItem(
        id: '1',
        title: 'SLIDE A',
        type: SlideType.welcome,
        durationSeconds: duration,
      ),
      MediaSlideItem(
        id: '2',
        title: 'SLIDE B',
        type: SlideType.welcome,
        durationSeconds: 20,
      ),
    ];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: MediaCarousel(items: buildItems(duration: 20))),
      ),
    );

    // t=15s: admin changes the slide duration — timer must restart.
    await tester.pump(const Duration(seconds: 15));
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: MediaCarousel(items: buildItems(duration: 60))),
      ),
    );

    // t=26s total: only 11s into the restarted 60s timer — still slide A.
    await tester.pump(const Duration(seconds: 11));
    expect(find.text('SLIDE B'), findsNothing);
  });
}
