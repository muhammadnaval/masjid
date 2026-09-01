import 'package:flutter_test/flutter_test.dart';

class MosqueProfileData {
  final String name;
  final String address;
  final String city;
  final String? logoUrl;

  MosqueProfileData({
    required this.name,
    required this.address,
    required this.city,
    this.logoUrl,
  });

  factory MosqueProfileData.fromJson(Map<String, dynamic> json) {
    return MosqueProfileData(
      name: json['name'] ?? 'MASJID AL-HIDAYAH SITEBA',
      address: json['address'] ?? 'Jl. Hamka No. 45, Siteba, Padang',
      city: json['city'] ?? 'Kota Padang',
      logoUrl: json['logo_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'address': address,
      'city': city,
      'logo_url': logoUrl,
    };
  }
}

void main() {
  group('Section 29.2 - Profil Masjid Unit Tests (TDD)', () {
    test('MosqueProfileData.fromJson parses JSON payload correctly', () {
      final json = {
        'name': 'MASJID AL-HIDAYAH SITEBA',
        'address': 'Jl. Hamka No. 45, Siteba, Padang',
        'city': 'Kota Padang',
        'logo_url': 'https://example.com/logo.png',
      };

      final profile = MosqueProfileData.fromJson(json);

      expect(profile.name, equals('MASJID AL-HIDAYAH SITEBA'));
      expect(profile.address, equals('Jl. Hamka No. 45, Siteba, Padang'));
      expect(profile.city, equals('Kota Padang'));
      expect(profile.logoUrl, equals('https://example.com/logo.png'));
    });

    test('MosqueProfileData.fromJson applies fallback values when fields missing', () {
      final profile = MosqueProfileData.fromJson({});

      expect(profile.name, equals('MASJID AL-HIDAYAH SITEBA'));
      expect(profile.address, contains('Siteba'));
      expect(profile.city, equals('Kota Padang'));
    });

    test('MosqueProfileData.toJson serializes object to Map', () {
      final profile = MosqueProfileData(
        name: 'MASJID AL-HIDAYAH',
        address: 'Padang',
        city: 'Kota Padang',
      );

      final json = profile.toJson();
      expect(json['name'], equals('MASJID AL-HIDAYAH'));
    });
  });
}
