import 'package:flutter/material.dart';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:masjid_display/main.dart';
import 'package:masjid_display/models/media_slide.dart';
import 'package:masjid_display/services/api_service.dart';

void main() {
  group('Sprint 9 production readiness', () {
    test('parses random hadis API into media slide', () {
      final slide = ApiService.parseRandomHadis({
        'status': true,
        'message': 'success',
        'data': {
          'text': {'ar': 'قال رسول الله ﷺ', 'id': 'Terjemah hadis'},
          'grade': 'Sahih',
          'takhrij': 'رواه مسلم',
        },
      });

      expect(slide?.id, 'random_hadis');
      expect(slide?.type, SlideType.hadith);
      expect(slide?.arabicText, 'قال رسول الله ﷺ');
      expect(slide?.subtitle, 'Grade: Sahih');
      expect(slide?.description, 'Terjemah hadis\nTakhrij: رواه مسلم');
    });

    test(
      'keeps cached prayer schedule when fresh API omits schedule',
      () async {
        final cached = {
          'todaySchedule': {'subuh': '05:01', 'dzuhur': '12:20'},
          'mosqueProfile': {'name': 'Nama Lama'},
        };
        final client = MockClient(
          (_) async => http.Response(
            jsonEncode({
              'status': 'success',
              'data': {
                'mosqueProfile': {'name': 'Nama Baru'},
              },
            }),
            200,
          ),
        );

        final state = await ApiService.fetchDisplayState(
          client: client,
          cachedState: cached,
        );

        expect(state?['todaySchedule'], {'subuh': '05:01', 'dzuhur': '12:20'});
        expect(state?['mosqueProfile'], {'name': 'Nama Baru'});
      },
    );
  });

  group('Sprint 8 display content', () {
    test('parses active dakwah, table, and upcoming agenda slides', () {
      final now = DateTime.utc(2026, 8, 2, 12);
      final slides = ApiService.parseSprint8Slides({
        'mediaItems': [
          {
            'id': 1,
            'title': 'AYAT HARI INI',
            'type': 'text',
            'content':
                '{"arabic_text":"إِنَّ مَعَ الْعُسْرِ يُسْرًا","content":"Sesungguhnya bersama kesulitan ada kemudahan.","subtitle":"QS. Al-Insyirah: 6"}',
            'duration_seconds': 12,
            'starts_at': '2026-08-02T00:00:00Z',
            'ends_at': '2026-08-03T00:00:00Z',
          },
          {
            'id': 2,
            'title': 'JADWAL KHUTBAH',
            'type': 'infoTable',
            'content':
                '{"headers":["Tanggal","Khatib"],"rows":[["7 Agustus","Ustadz Ahmad"]]}',
            'duration_seconds': 10,
          },
          {
            'id': 3,
            'title': 'KONTEN LAMA',
            'type': 'hadith',
            'content': 'Tidak boleh tampil',
            'ends_at': '2026-08-01T00:00:00Z',
          },
        ],
        'agendas': [
          {
            'id': 4,
            'title': 'Maulid Nabi',
            'description': 'Kajian ba’da Maghrib',
            'starts_at': '2026-08-05T12:00:00Z',
            'ends_at': '2026-08-05T14:00:00Z',
            'is_active': true,
          },
        ],
      }, now: now);

      expect(slides, hasLength(3));
      expect(slides[0].type, SlideType.dakwahText);
      expect(slides[0].arabicText, 'إِنَّ مَعَ الْعُسْرِ يُسْرًا');
      expect(slides[0].subtitle, 'QS. Al-Insyirah: 6');
      expect(slides[1].type, SlideType.infoTable);
      expect(slides[1].tableHeaders, ['Tanggal', 'Khatib']);
      expect(slides[1].tableRows, [
        ['7 Agustus', 'Ustadz Ahmad'],
      ]);
      expect(slides[2].title, 'Maulid Nabi');
      expect(slides[2].subtitle, '5 Agustus 2026');
    });

    testWidgets('TV display renders active dakwah content from API state', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(1920, 1080);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          home: TVDisplayScreen(
            displayState: {
              'mediaItems': [
                {
                  'id': 5,
                  'title': 'AYAT PILIHAN',
                  'type': 'text',
                  'content':
                      '{"arabic_text":"فَاذْكُرُونِي أَذْكُرْكُمْ","content":"Ingatlah kepada-Ku.","subtitle":"QS. Al-Baqarah: 152"}',
                },
              ],
              'agendas': [],
            },
          ),
        ),
      );
      await tester.pump();

      expect(find.text('AYAT PILIHAN'), findsOneWidget);
      expect(find.text('فَاذْكُرُونِي أَذْكُرْكُمْ'), findsOneWidget);
      expect(find.text('QS. Al-Baqarah: 152'), findsOneWidget);
    });

    testWidgets('TV display renders donation settings from API state', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(1920, 1080);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          home: TVDisplayScreen(
            displayState: {
              'mediaItems': [],
              'agendas': [],
              'donationSettings': {
                'is_active': true,
                'title': 'DONASI RENOVASI ADMIN',
                'description': 'Scan QRIS admin',
                'account_name': 'BSI 123 a.n Admin',
                'qr_code_path': 'donasi/admin-qris.png',
              },
            },
          ),
        ),
      );
      await tester.pump();

      expect(find.text('DONASI RENOVASI ADMIN'), findsOneWidget);
      expect(find.text('Scan QRIS admin'), findsOneWidget);
      expect(find.text('BSI 123 a.n Admin'), findsOneWidget);
      expect(find.text('INFAQ & DONASI MASJID'), findsNothing);
      expect(
        find.text('Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah'),
        findsNothing,
      );
    });

    testWidgets('TV display renders backend random doa Arabic text', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(1920, 1080);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          home: TVDisplayScreen(
            displayState: {
              'mediaItems': [
                {
                  'id': 'random_doa',
                  'title': 'DOA PILIHAN',
                  'type': 'hadith',
                  'content':
                      '{"subtitle":"Doa Masuk Kamar Mandi","arabic_text":"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ","content":"Ya Allah, aku berlindung kepada-Mu."}',
                },
              ],
              'agendas': [],
            },
          ),
        ),
      );
      await tester.pump();

      expect(find.text('DOA PILIHAN'), findsOneWidget);
      expect(find.text('اللَّهُمَّ إِنِّي أَعُوذُ بِكَ'), findsOneWidget);
      expect(find.text('Doa Masuk Kamar Mandi'), findsOneWidget);
    });
  });
}
