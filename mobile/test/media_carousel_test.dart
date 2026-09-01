import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/models/media_slide.dart';
import 'package:masjid_display/widgets/media_carousel.dart';
import 'package:masjid_display/widgets/youtube_player_widget.dart';

void main() {
  group('Section 29.13 - Media Item Model Tests (TDD Unit)', () {
    test('adds or removes donation slide based on setting', () {
      final base = MediaSlideItem(
        id: 'announcement',
        title: 'Info',
        type: SlideType.announcement,
      );
      final donation = MediaSlideItem(
        id: 'donation_slide',
        title: 'Donasi',
        type: SlideType.donation,
      );

      expect(withDonationSlide([base], donation), [base, donation]);
      expect(withDonationSlide([base, donation], null), [base]);
    });

    test(
      'creates MediaSlideItem with image slide type and custom duration',
      () {
        final item = MediaSlideItem(
          id: 'img-101',
          title: 'POSTER KAJIAN AKBAR',
          type: SlideType.image,
          imagePath: 'https://example.com/poster.jpg',
          durationSeconds: 15,
        );

        expect(item.id, equals('img-101'));
        expect(item.title, equals('POSTER KAJIAN AKBAR'));
        expect(item.type, equals(SlideType.image));
        expect(item.imagePath, equals('https://example.com/poster.jpg'));
        expect(item.durationSeconds, equals(15));
      },
    );

    test('creates MediaSlideItem with video slide type', () {
      final item = MediaSlideItem(
        id: 'vid-202',
        title: 'VIDEO PROFIL MASJID',
        subtitle: 'Dokumentasi Kegiatan Ramadhan',
        type: SlideType.video,
        imagePath: 'https://example.com/profil.mp4',
        durationSeconds: 30,
      );

      expect(item.id, equals('vid-202'));
      expect(item.type, equals(SlideType.video));
      expect(item.subtitle, equals('Dokumentasi Kegiatan Ramadhan'));
      expect(item.durationSeconds, equals(30));
    });

    test('extracts standard and live YouTube IDs', () {
      expect(
        YouTubePlayerWidget.extractYouTubeId(
          'https://www.youtube.com/watch?v=abcdefghijk',
        ),
        'abcdefghijk',
      );
      expect(
        YouTubePlayerWidget.extractYouTubeId(
          'https://www.youtube.com/live/abcdefghijk',
        ),
        'abcdefghijk',
      );
      expect(YouTubePlayerWidget.extractYouTubeId('invalid'), '');
    });

    testWidgets('renders livestream with live YouTube player', (tester) async {
      final livestream = MediaSlideItem(
        id: 'live-1',
        title: 'SIARAN LANGSUNG',
        type: SlideType.livestream,
        imagePath: 'invalid-live-url',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: SizedBox(
            width: 800,
            height: 450,
            child: MediaCarousel(items: [livestream]),
          ),
        ),
      );

      final player = tester.widget<YouTubePlayerWidget>(
        find.byType(YouTubePlayerWidget),
      );
      expect(player.isLive, isTrue);
    });

    test('supports all slide types in SlideType enum', () {
      expect(SlideType.values, contains(SlideType.image));
      expect(SlideType.values, contains(SlideType.video));
      expect(SlideType.values, contains(SlideType.hadith));
      expect(SlideType.values, contains(SlideType.announcement));
      expect(SlideType.values, contains(SlideType.kasTable));
      expect(SlideType.values, contains(SlideType.welcome));
    });
  });

  group('Section 29.13 - MediaCarousel Widget Tests (TDD Widget)', () {
    testWidgets('renders initial MediaCarousel slide and welcome text', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SizedBox(width: 800, height: 450, child: MediaCarousel()),
          ),
        ),
      );

      expect(find.text('SELAMAT DATANG DI MASJID AL-HIDAYAH'), findsOneWidget);
    });

    testWidgets('renders donation QR slide content', (
      WidgetTester tester,
    ) async {
      final donation = MediaSlideItem(
        id: 'donation_slide',
        title: 'DONASI MASJID',
        subtitle: 'Pindai QRIS',
        arabicText: 'Bank Masjid 123',
        type: SlideType.donation,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 800,
              height: 450,
              child: MediaCarousel(items: [donation]),
            ),
          ),
        ),
      );

      expect(find.text('DONASI MASJID'), findsOneWidget);
      expect(find.text('Pindai QRIS'), findsOneWidget);
      expect(find.text('Bank Masjid 123'), findsOneWidget);
    });

    testWidgets('pauses during adzan or iqamah and resumes afterward', (
      WidgetTester tester,
    ) async {
      final items = [
        MediaSlideItem(
          id: '1',
          title: 'SLIDE PERTAMA',
          type: SlideType.announcement,
          durationSeconds: 1,
        ),
        MediaSlideItem(
          id: '2',
          title: 'SLIDE KEDUA',
          type: SlideType.announcement,
          durationSeconds: 1,
        ),
      ];

      Widget carousel(bool isPaused) => MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 800,
            height: 450,
            child: MediaCarousel(items: items, isPaused: isPaused),
          ),
        ),
      );

      await tester.pumpWidget(carousel(true));
      await tester.pump(const Duration(seconds: 2));
      expect(find.text('SLIDE PERTAMA'), findsOneWidget);
      expect(find.text('SLIDE KEDUA'), findsNothing);

      await tester.pumpWidget(carousel(false));
      await tester.pump(const Duration(seconds: 1));
      await tester.pump();
      expect(find.text('SLIDE KEDUA'), findsOneWidget);
    });
  });
}
