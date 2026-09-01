import 'dart:math' as math;
import 'dart:typed_data';

/// Synthesizes a short sine-wave beep as a 16-bit PCM WAV [Uint8List].
/// Pure stdlib — no asset files, no extra deps. Played via audioplayers
/// `BytesSource`.
class BeepTone {
  /// 880 Hz, 0.18s, mild fade to avoid clicks. Good enough for a TV countdown.
  static Uint8List build({
    double frequency = 880,
    double durationSec = 0.18,
    int sampleRate = 44100,
    double volume = 0.6,
  }) {
    final numSamples = (sampleRate * durationSec).round();
    final dataSize = numSamples * 2; // 16-bit mono
    final header = _wavHeader(dataSize, sampleRate);
    final data = ByteData(dataSize);

    final fadeSamples = (sampleRate * 0.008).round(); // 8ms fade in/out
    for (var i = 0; i < numSamples; i++) {
      var amp = volume;
      if (i < fadeSamples) {
        amp *= i / fadeSamples;
      } else if (i > numSamples - fadeSamples) {
        amp *= (numSamples - i) / fadeSamples;
      }
      final t = i / sampleRate;
      // sine + tiny 2nd harmonic for a cleaner "electronic" tone
      final s = (amp * (0.85 * math.sin(2 * math.pi * frequency * t) +
          0.15 * math.sin(2 * math.pi * frequency * 2 * t)));
      final v = (s * 32767).round().clamp(-32768, 32767);
      data.setInt16(i * 2, v, Endian.little);
    }

    final out = BytesBuilder();
    out.add(header);
    out.add(data.buffer.asUint8List());
    return out.toBytes();
  }

  static Uint8List _wavHeader(int dataSize, int sampleRate) {
    final b = ByteData(44);
    // RIFF
    b.setUint8(0, 0x52); b.setUint8(1, 0x49); b.setUint8(2, 0x46); b.setUint8(3, 0x46);
    b.setUint32(4, 36 + dataSize, Endian.little);
    b.setUint8(8, 0x57); b.setUint8(9, 0x41); b.setUint8(10, 0x56); b.setUint8(11, 0x45);
    // fmt
    b.setUint8(12, 0x66); b.setUint8(13, 0x6d); b.setUint8(14, 0x74); b.setUint8(15, 0x20);
    b.setUint32(16, 16, Endian.little);
    b.setUint16(20, 1, Endian.little); // PCM
    b.setUint16(22, 1, Endian.little); // mono
    b.setUint32(24, sampleRate, Endian.little);
    b.setUint32(28, sampleRate * 2, Endian.little); // byte rate
    b.setUint16(32, 2, Endian.little); // block align
    b.setUint16(34, 16, Endian.little); // bits per sample
    // data
    b.setUint8(36, 0x64); b.setUint8(37, 0x61); b.setUint8(38, 0x74); b.setUint8(39, 0x61);
    b.setUint32(40, dataSize, Endian.little);
    return b.buffer.asUint8List();
  }


}
