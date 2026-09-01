import 'package:audioplayers/audioplayers.dart';
import 'beep_tone.dart';

class AudioEngineService {
  static final AudioPlayer _player = AudioPlayer();
  static bool _isPlaying = false;

  static bool get isPlaying => _isPlaying;

  static double normalizeVolume(double volume) =>
      (volume > 1 ? volume / 100 : volume).clamp(0.0, 1.0);

  static Future<void> playAdzan({
    String? customUrl,
    double volume = 80.0,
  }) async {
    try {
      await _player.stop();
      await _player.setVolume(normalizeVolume(volume));
      if (customUrl != null && customUrl.isNotEmpty) {
        await _player.play(UrlSource(customUrl));
      } else {
        await _player.play(AssetSource('audio/adzan.mp3'));
      }
      _isPlaying = true;
    } catch (e) {
      _isPlaying = false;
    }
  }

  static Future<void> playMurottal({
    String? customUrl,
    double volume = 70.0,
  }) async {
    try {
      await _player.stop();
      await _player.setVolume(normalizeVolume(volume));
      if (customUrl != null && customUrl.isNotEmpty) {
        await _player.play(UrlSource(customUrl));
      } else {
        await _player.play(AssetSource('audio/murottal_kahfi.mp3'));
      }
      _isPlaying = true;
    } catch (e) {
      _isPlaying = false;
    }
  }

  static Future<void> playDzikir({
    required bool isPagi,
    String? customUrl,
    double volume = 75.0,
  }) async {
    try {
      await _player.stop();
      await _player.setVolume(normalizeVolume(volume));
      final assetPath = isPagi
          ? 'audio/dzikir_pagi.mp3'
          : 'audio/dzikir_petang.mp3';
      if (customUrl != null && customUrl.isNotEmpty) {
        await _player.play(UrlSource(customUrl));
      } else {
        await _player.play(AssetSource(assetPath));
      }
      _isPlaying = true;
    } catch (e) {
      _isPlaying = false;
    }
  }

  /// One short beep for the final-10-seconds countdown. Synthesized in
  /// memory — no asset needed. Uses a throwaway player so it never interrupts
  /// adzan/murottal audio on the main [_player].
  static Future<void> playBeep({double volume = 70.0}) async {
    try {
      final bytes = BeepTone.build(volume: normalizeVolume(volume));
      await AudioPlayer().play(BytesSource(bytes));
    } catch (_) {}
  }

  static Future<void> stop() async {
    try {
      await _player.stop();
      _isPlaying = false;
    } catch (e) {
      _isPlaying = false;
    }
  }
}
