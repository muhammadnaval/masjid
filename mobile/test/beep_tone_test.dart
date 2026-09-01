import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:masjid_display/services/beep_tone.dart';

void main() {
  test('BeepTone produces a well-formed 16-bit mono PCM WAV', () {
    final bytes = BeepTone.build(frequency: 880, durationSec: 0.1);
    expect(bytes, isA<Uint8List>());

    // RIFF header
    expect(String.fromCharCodes(bytes.sublist(0, 4)), 'RIFF');
    expect(String.fromCharCodes(bytes.sublist(8, 12)), 'WAVE');
    expect(String.fromCharCodes(bytes.sublist(12, 16)), 'fmt ');
    expect(String.fromCharCodes(bytes.sublist(36, 40)), 'data');

    final byteData = ByteData.sublistView(bytes);
    expect(byteData.getUint16(20, Endian.little), 1); // PCM
    expect(byteData.getUint16(22, Endian.little), 1); // mono
    expect(byteData.getUint32(24, Endian.little), 44100); // sample rate
    expect(byteData.getUint16(34, Endian.little), 16); // bits per sample

    final numSamples = (44100 * 0.1).round();
    expect(bytes.length, 44 + numSamples * 2);

    // a non-trivial sample must exist (actual sine content)
    var maxAbs = 0;
    for (var i = 0; i < numSamples; i++) {
      final v = byteData.getInt16(44 + i * 2, Endian.little).abs();
      if (v > maxAbs) maxAbs = v;
    }
    expect(maxAbs, greaterThan(1000));
  });

  test('beep is non-silent and clamps within 16-bit range', () {
    final bytes = BeepTone.build(volume: 1.0, durationSec: 0.05);
    final bd = ByteData.sublistView(bytes);
    final numSamples = (44100 * 0.05).round();
    var maxAbs = 0;
    for (var i = 0; i < numSamples; i++) {
      final v = bd.getInt16(44 + i * 2, Endian.little).abs();
      if (v > maxAbs) maxAbs = v;
    }
    expect(maxAbs, lessThanOrEqualTo(32767));
    expect(maxAbs, greaterThan(20000)); // near full-scale at volume 1.0
  });
}
