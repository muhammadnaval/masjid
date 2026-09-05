import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/media_slide.dart';

class ApiService {
  static const _displayStateCacheKey = 'display_state_cache_v1';

  static const baseUrl = String.fromEnvironment(
    'LARAVEL_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );
  static const displayStateUrl = String.fromEnvironment(
    'DISPLAY_STATE_URL',
    defaultValue:
        'http://10.0.2.2:8000/api/display/state',
  );

  static Future<Map<String, dynamic>?> loadCachedDisplayState() async {
    try {
      final raw = await SharedPreferencesAsync().getString(
        _displayStateCacheKey,
      );
      if (raw == null) return null;
      final decoded = jsonDecode(raw);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      return null;
    }
  }

  static List<MediaSlideItem> parseSprint8Slides(
    Map<String, dynamic> data, {
    DateTime? now,
  }) {
    final current = now ?? DateTime.now();
    final slides = <MediaSlideItem>[];

    for (final raw in data['mediaItems'] as List? ?? const []) {
      if (raw is! Map || !_isActiveAt(raw, current)) continue;
      final type = _slideType(raw['type']);
      if (type == null) continue;
      final content = _content(raw['content']);
      final description = _description(raw['content'], content);
      slides.add(
        MediaSlideItem(
          id: raw['id'].toString(),
          title: raw['title']?.toString() ?? '',
          type: type,
          subtitle: (content['subtitle'] ?? raw['subtitle'])?.toString(),
          arabicText:
              (content['arabic_text'] ??
                      content['arabic'] ??
                      raw['arabic_text'] ??
                      raw['arabicText'])
                  ?.toString(),
          translationText: description,
          description: description,
          imagePath: _url(raw['url'] ?? raw['file_path'] ?? raw['imagePath']),
          tableHeaders: _strings(content['headers']),
          tableRows: _rows(content['rows']),
          durationSeconds:
              int.tryParse(
                (raw['duration_seconds'] ?? raw['durationSeconds'])
                        ?.toString() ??
                    '',
              ) ??
              8,
        ),
      );
    }

    for (final raw in data['agendas'] as List? ?? const []) {
      if (raw is! Map || raw['is_active'] == false) continue;
      final startsAt = DateTime.tryParse(raw['starts_at']?.toString() ?? '');
      final endsAt = DateTime.tryParse(raw['ends_at']?.toString() ?? '');
      if ((endsAt != null && endsAt.isBefore(current)) || startsAt == null) {
        continue;
      }
      slides.add(
        MediaSlideItem(
          id: 'agenda_${raw['id']}',
          title: raw['title']?.toString() ?? 'Agenda Masjid',
          type: SlideType.announcement,
          subtitle: _indonesianDate(startsAt),
          translationText: raw['description']?.toString(),
          durationSeconds:
              int.tryParse(raw['duration_seconds']?.toString() ?? '') ?? 8,
        ),
      );
    }
    return slides;
  }

  static bool _isActiveAt(Map raw, DateTime now) {
    if (raw['is_active'] == false) return false;
    final startsAt = DateTime.tryParse(raw['starts_at']?.toString() ?? '');
    final endsAt = DateTime.tryParse(raw['ends_at']?.toString() ?? '');
    return (startsAt == null || !startsAt.isAfter(now)) &&
        (endsAt == null || !endsAt.isBefore(now));
  }

  static SlideType? _slideType(Object? value) => switch (value?.toString()) {
    'text' => SlideType.dakwahText,
    'hadith' => SlideType.hadith,
    'kasTable' || 'kastable' => SlideType.kasTable,
    'infoTable' || 'infotable' => SlideType.infoTable,
    _ => null,
  };

  static Map<String, dynamic> _content(Object? value) {
    if (value is Map<String, dynamic>) return value;
    if (value is! String || !value.trimLeft().startsWith('{')) return {};
    try {
      final decoded = jsonDecode(value);
      return decoded is Map<String, dynamic> ? decoded : {};
    } catch (_) {
      return {};
    }
  }

  static String? _description(Object? rawValue, Map<String, dynamic> content) {
    final value =
        content['content'] ??
        content['description'] ??
        content['translation'] ??
        (rawValue is String ? rawValue : null);
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static String? _url(Object? value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }

  static List<String>? _strings(Object? value) =>
      value is List ? value.map((item) => item.toString()).toList() : null;

  static List<List<String>>? _rows(Object? value) => value is List
      ? value
            .whereType<List>()
            .map((row) => row.map((cell) => cell.toString()).toList())
            .toList()
      : null;

  static String _indonesianDate(DateTime date) {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  static Future<Map<String, dynamic>?> fetchDisplayState({
    http.Client? client,
    Map<String, dynamic>? cachedState,
  }) async {
    try {
      final response =
          await (client?.get(Uri.parse(displayStateUrl)) ??
                  http.get(Uri.parse(displayStateUrl)))
              .timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['status'] == 'success' &&
            json['data'] is Map<String, dynamic>) {
          final fresh = json['data'] as Map<String, dynamic>;
          final cached = cachedState ?? await loadCachedDisplayState();
          final data = {...?cached, ...fresh};
          try {
            await SharedPreferencesAsync().setString(
              _displayStateCacheKey,
              jsonEncode(data),
            );
          } catch (_) {}
          return data;
        }
      }
    } catch (_) {}
    return loadCachedDisplayState();
  }
}
