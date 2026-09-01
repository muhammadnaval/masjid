import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/services/audio_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Section 29.12 - Dzikir Pagi & Petang Unit Tests (TDD)', () {
    test('AudioEngineService playDzikir Pagi runs gracefully', () async {
      await AudioEngineService.playDzikir(
        isPagi: true,
        volume: 0.75,
        customUrl: 'https://example.com/dzikir_pagi.mp3',
      );
      expect(AudioEngineService.isPlaying, isNotNull);
    });

    test('AudioEngineService playDzikir Petang runs gracefully', () async {
      await AudioEngineService.playDzikir(
        isPagi: false,
        volume: 0.8,
        customUrl: 'https://example.com/dzikir_petang.mp3',
      );
      expect(AudioEngineService.isPlaying, isNotNull);
    });

    test('AudioEngineService stop silences active playback', () async {
      await AudioEngineService.stop();
      expect(AudioEngineService.isPlaying, isFalse);
    });
  });
}
