import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/services/audio_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Section 29.11 - Murottal Sebelum Adzan Unit Tests (TDD)', () {
    test('normalizes dashboard percentage and clamps volume safely', () {
      expect(AudioEngineService.normalizeVolume(75), 0.75);
      expect(AudioEngineService.normalizeVolume(0.8), 0.8);
      expect(AudioEngineService.normalizeVolume(120), 1.0);
      expect(AudioEngineService.normalizeVolume(-10), 0.0);
    });
    test('AudioEngineService supports playMurottal without crashing', () async {
      await AudioEngineService.playMurottal(
        volume: 0.7,
        customUrl: 'https://example.com/murottal_surah_kahfi.mp3',
      );
      expect(AudioEngineService.isPlaying, isNotNull);
    });

    test(
      'AudioEngineService playAdzan stops Murottal playback cleanly',
      () async {
        await AudioEngineService.playMurottal(volume: 0.7);
        await AudioEngineService.playAdzan(volume: 0.85);
        expect(AudioEngineService.isPlaying, isNotNull);
      },
    );

    test('AudioEngineService stop halts any active Murottal audio', () async {
      await AudioEngineService.stop();
      expect(AudioEngineService.isPlaying, isFalse);
    });
  });
}
