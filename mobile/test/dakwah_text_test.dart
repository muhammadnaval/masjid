import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/models/media_slide.dart';

void main() {
  group('Section 29.14 - Konten Dakwah Teks Unit Tests (TDD)', () {
    test('creates Hadith MediaSlideItem with Arabic text and translation correctly', () {
      final item = MediaSlideItem(
        id: '101',
        title: 'HADITS HARI INI',
        type: SlideType.hadith,
        subtitle: '(HR. Bukhari & Muslim)',
        arabicText: 'مَنْ بَنَى مَسْجِدًالِلَّهِ بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ',
        translationText: 'Barangsiapa membangun masjid karena Allah, maka Allah akan bangunkan baginya yang serupa di surga.',
        durationSeconds: 12,
      );

      expect(item.type, equals(SlideType.hadith));
      expect(item.arabicText, contains('مَسْجِدًالِلَّهِ'));
      expect(item.translationText, contains('membangun masjid'));
      expect(item.subtitle, equals('(HR. Bukhari & Muslim)'));
      expect(item.durationSeconds, equals(12));
    });

    test('creates Announcement MediaSlideItem for Agenda Kajian', () {
      final item = MediaSlideItem(
        id: '102',
        title: 'AGENDA KAJIAN RUTIN',
        type: SlideType.announcement,
        subtitle: 'Ustadz Dr. H. Ahmad Fauzi',
        translationText: 'Kajian Rutin Fiqih Ibadah setiap Ahad Subuh.',
        durationSeconds: 8,
      );

      expect(item.type, equals(SlideType.announcement));
      expect(item.title, equals('AGENDA KAJIAN RUTIN'));
      expect(item.subtitle, equals('Ustadz Dr. H. Ahmad Fauzi'));
    });
  });
}
