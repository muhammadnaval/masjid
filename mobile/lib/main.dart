import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';

import 'models/display_state.dart';
import 'models/prayer_schedule.dart';
import 'models/media_slide.dart';
import 'services/api_service.dart';
import 'services/prayer_service.dart';

import 'services/audio_service.dart';
import 'widgets/header_bar.dart';
import 'widgets/prayer_schedule_row.dart';
import 'widgets/media_carousel.dart';
import 'widgets/running_text_bar.dart';
import 'widgets/adzan_overlay.dart';
import 'widgets/countdown_overlay.dart';
import 'widgets/iqamah_overlay.dart';
import 'widgets/syuruq_overlay.dart';
import 'widgets/friday_khutbah_overlay.dart';
import 'widgets/media_fullscreen_overlay.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MasjidDisplayApp());
}

class MasjidDisplayApp extends StatelessWidget {
  const MasjidDisplayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Masjid Display',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F17),
        useMaterial3: true,
      ),
      home: const TVDisplayScreen(),
    );
  }
}

class TVDisplayScreen extends StatefulWidget {
  final Map<String, dynamic>? displayState;

  const TVDisplayScreen({super.key, this.displayState});

  @override
  State<TVDisplayScreen> createState() => _TVDisplayScreenState();
}

class _TVDisplayScreenState extends State<TVDisplayScreen> {
  late DateTime _currentTime;
  Timer? _clockTimer;
  Timer? _apiPollTimer;

  String _mosqueName = "MASJID AL-HIDAYAH SITEBA";
  String _mosqueAddress =
      "Jl. Siteba No. 12, Surau Gadang, Nanggalo, Kota Padang";
  int _hijriCorrectionDays = 0;
  String? _logoUrl;
  String? _backgroundUrl;
  String _runningTextContent =
      "Selamat Datang di Masjid Al-Hidayah Siteba • Mohon menonaktifkan atau mematikan nada dering Handphone selama berada di dalam area masjid demi menjaga kekhusyukan ibadah";
  int _runningTextSpeed = 50;

  Color _themePrimaryColor = const Color(0xFF10B981);
  Color _themeSecondaryColor = const Color(0xFFF59E0B);
  Color _themeBackgroundColor = const Color(0xFF0F172A);
  Color _themeTextColor = Colors.white;
  String _layoutMode = 'default';

  DisplayMode _currentMode = DisplayMode.normal;

  late DailyPrayerSchedule _schedule;
  bool _isApiScheduleLoaded = false;
  PrayerScheduleItem? _nextPrayer;
  Duration _nextPrayerCountdown = Duration.zero;
  List<MediaSlideItem>? _mediaSlides;

  Map<String, dynamic>? _audioSettings;
  Map<String, dynamic>? _adzanSettings;
  Map<String, dynamic>? _fridaySettings;
  Map<String, dynamic>? _syuruqSettings;
  Map<String, dynamic>? _countdownSettings;
  Timer? _adzanTimer;
  Timer? _fridayTimer;
  DateTime? _postIqamahBlackUntil;
  String? _lastTriggeredPrayerKey;
  PrayerScheduleItem? _activePrayer;
  late DateTime _audioFlagsDate;
  int _lastBeepSecond = -1; // dedupe per-second beep in final 10s

  @override
  void initState() {
    super.initState();
    _currentTime = PrayerService.masjidTime(DateTime.now());
    _audioFlagsDate = DateTime(
      _currentTime.year,
      _currentTime.month,
      _currentTime.day,
    );
    _updateScheduleAndNextPrayer();
    _startClockTimer();
    if (widget.displayState case final state?) {
      _applyApiState(state);
    } else {
      _loadCachedThenFreshState();
      _apiPollTimer = Timer.periodic(
        const Duration(seconds: 10),
        (_) => _fetchApiState(),
      );
    }
  }

  Future<void> _loadCachedThenFreshState() async {
    final cached = await ApiService.loadCachedDisplayState();
    if (cached != null) _applyApiState(cached);
    await _fetchApiState();
  }

  /// Resolve relative storage proxy path to absolute URL
  String? _resolveStorageUrl(String? urlPath) {
    if (urlPath == null || urlPath.isEmpty) return null;
    // Already an absolute URL
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    // Relative path from backend proxy (e.g. /storage/masjid-assets/file.png)
    final serverBase = ApiService.baseUrl.replaceAll('/api/v1', '');
    return '$serverBase$urlPath';
  }

  Future<void> _fetchApiState() async {
    final apiData = await ApiService.fetchDisplayState();
    if (apiData != null) _applyApiState(apiData);
  }

  void _applyApiState(Map<String, dynamic> apiData) {
    if (mounted) {
      setState(() {
        final prof = apiData['mosqueProfile'];
        if (prof != null) {
          _mosqueName = prof['name'] ?? _mosqueName;
          _mosqueAddress = prof['address'] ?? _mosqueAddress;
          _logoUrl = _resolveStorageUrl(prof['logo_path']);
          _backgroundUrl = _resolveStorageUrl(prof['background_path']);
        }
        _hijriCorrectionDays =
            apiData['hijriCorrectionDays'] ?? _hijriCorrectionDays;
        _audioSettings =
            apiData['audioSettings'] as Map<String, dynamic>? ?? _audioSettings;
        _adzanSettings =
            apiData['adzanSettings'] as Map<String, dynamic>? ?? _adzanSettings;
        _fridaySettings =
            apiData['fridaySettings'] as Map<String, dynamic>? ??
            _fridaySettings;
        _syuruqSettings =
            apiData['syuruqSettings'] as Map<String, dynamic>? ??
            _syuruqSettings;
        _countdownSettings =
            apiData['countdownSettings'] as Map<String, dynamic>? ??
            _countdownSettings;

        final themeData = apiData['themeSettings'];
        if (themeData != null) {
          try {
            if (themeData['primary_color'] != null) {
              final hex = themeData['primary_color'].toString().replaceAll(
                '#',
                '',
              );
              _themePrimaryColor = Color(int.parse('FF$hex', radix: 16));
            }
            if (themeData['secondary_color'] != null) {
              final hex = themeData['secondary_color'].toString().replaceAll(
                '#',
                '',
              );
              _themeSecondaryColor = Color(int.parse('FF$hex', radix: 16));
            }
            if (themeData['background_color'] != null) {
              final hex = themeData['background_color'].toString().replaceAll(
                '#',
                '',
              );
              _themeBackgroundColor = Color(int.parse('FF$hex', radix: 16));
            }
            if (themeData['text_color'] != null) {
              final hex = themeData['text_color'].toString().replaceAll(
                '#',
                '',
              );
              _themeTextColor = Color(int.parse('FF$hex', radix: 16));
            }

            final rawLayout = themeData['layout_config'];
            if (rawLayout != null) {
              if (rawLayout is Map && rawLayout['mode'] != null) {
                _layoutMode = rawLayout['mode'].toString();
              } else if (rawLayout is String) {
                try {
                  final parsed = jsonDecode(rawLayout);
                  if (parsed is Map && parsed['mode'] != null) {
                    _layoutMode = parsed['mode'].toString();
                  } else {
                    _layoutMode = rawLayout;
                  }
                } catch (_) {
                  _layoutMode = rawLayout;
                }
              }
            }
          } catch (_) {}
        }
        final schedData = apiData['todaySchedule'];
        if (schedData != null) {
          final today = PrayerService.masjidTime(DateTime.now());
          final iqamahData = apiData['iqamahSettings'] as Map? ?? const {};
          Map iqamahFor(String prayer) =>
              iqamahData[prayer] as Map? ?? const {};
          final items = [
            PrayerScheduleItem(
              name: PrayerName.imsak,
              timeString: schedData['imsak'] ?? '04:54',
              time: PrayerService.parseTimeString(
                today,
                schedData['imsak'] ?? '04:54',
              ),
              isIqamahEnabled: false,
            ),
            PrayerScheduleItem(
              name: PrayerName.subuh,
              timeString: schedData['subuh'] ?? '05:04',
              time: PrayerService.parseTimeString(
                today,
                schedData['subuh'] ?? '05:04',
              ),
              isIqamahEnabled: iqamahFor('subuh')['is_enabled'] != false,
              iqamahDurationMinutes:
                  (iqamahFor('subuh')['duration_minutes'] as num?)?.toInt() ??
                  10,
            ),
            PrayerScheduleItem(
              name: PrayerName.syuruq,
              timeString: schedData['syuruq'] ?? '06:19',
              time: PrayerService.parseTimeString(
                today,
                schedData['syuruq'] ?? '06:19',
              ),
              isIqamahEnabled: false,
            ),
            PrayerScheduleItem(
              name: today.weekday == DateTime.friday
                  ? PrayerName.jumat
                  : PrayerName.dzuhur,
              timeString: schedData['dzuhur'] ?? '12:28',
              time: PrayerService.parseTimeString(
                today,
                schedData['dzuhur'] ?? '12:28',
              ),
              isIqamahEnabled:
                  today.weekday != DateTime.friday &&
                  iqamahFor('dzuhur')['is_enabled'] != false,
              iqamahDurationMinutes:
                  (iqamahFor('dzuhur')['duration_minutes'] as num?)?.toInt() ??
                  10,
            ),
            PrayerScheduleItem(
              name: PrayerName.ashar,
              timeString: schedData['ashar'] ?? '15:50',
              time: PrayerService.parseTimeString(
                today,
                schedData['ashar'] ?? '15:50',
              ),
              isIqamahEnabled: iqamahFor('ashar')['is_enabled'] != false,
              iqamahDurationMinutes:
                  (iqamahFor('ashar')['duration_minutes'] as num?)?.toInt() ??
                  8,
            ),
            PrayerScheduleItem(
              name: PrayerName.maghrib,
              timeString: schedData['maghrib'] ?? '18:30',
              time: PrayerService.parseTimeString(
                today,
                schedData['maghrib'] ?? '18:30',
              ),
              isIqamahEnabled: iqamahFor('maghrib')['is_enabled'] != false,
              iqamahDurationMinutes:
                  (iqamahFor('maghrib')['duration_minutes'] as num?)?.toInt() ??
                  7,
            ),
            PrayerScheduleItem(
              name: PrayerName.isya,
              timeString: schedData['isya'] ?? '19:42',
              time: PrayerService.parseTimeString(
                today,
                schedData['isya'] ?? '19:42',
              ),
              isIqamahEnabled: iqamahFor('isya')['is_enabled'] != false,
              iqamahDurationMinutes:
                  (iqamahFor('isya')['duration_minutes'] as num?)?.toInt() ??
                  10,
            ),
          ];
          _schedule = DailyPrayerSchedule(
            date: today,
            cityName: apiData['prayerLocation']?['city_name'] ?? 'KOTA PADANG',
            items: items,
          );
          _isApiScheduleLoaded = true;
          _nextPrayer = PrayerService.getNextPrayer(_schedule, _currentTime);
          if (_nextPrayer != null) {
            _nextPrayerCountdown = PrayerService.getCountdownToNextPrayer(
              _nextPrayer!,
              _currentTime,
            );
          }
        }
        final mediaList = apiData['mediaItems'] as List?;
        if (mediaList != null) {
          _mediaSlides = mediaList.map((m) {
            SlideType type = SlideType.announcement;
            final typeStr = (m['type'] ?? 'announcement')
                .toString()
                .toLowerCase();
            if (typeStr == 'image') {
              type = SlideType.image;
            } else if (typeStr == 'video') {
              type = SlideType.video;
            } else if (typeStr == 'youtube') {
              type = SlideType.youtube;
            } else if (typeStr == 'livestream') {
              type = SlideType.livestream;
            } else if (typeStr == 'hadith') {
              type = SlideType.hadith;
            } else if (typeStr == 'welcome') {
              type = SlideType.welcome;
            } else if (typeStr == 'kastable') {
              type = SlideType.kasTable;
            } else if (typeStr == 'infotable') {
              type = SlideType.infoTable;
            }

            List<String>? headers;
            List<List<String>>? rows;
            Map<String, dynamic>? tableMap;

            final rawContent = m['content'];
            final contentStr = rawContent?.toString();
            Map<String, dynamic>? contentMap;
            if (rawContent is Map<String, dynamic>) {
              contentMap = rawContent;
            } else if (contentStr != null &&
                contentStr.trim().startsWith('{')) {
              try {
                final decoded = jsonDecode(contentStr);
                if (decoded is Map<String, dynamic>) contentMap = decoded;
              } catch (_) {}
            }
            if (contentMap != null) {
              if (contentMap.containsKey('headers') &&
                  contentMap.containsKey('rows')) {
                headers = (contentMap['headers'] as List?)
                    ?.map((e) => e.toString())
                    .toList();
                rows = (contentMap['rows'] as List?)
                    ?.map(
                      (row) =>
                          (row as List).map((cell) => cell.toString()).toList(),
                    )
                    .toList();
              } else {
                tableMap = contentMap;
              }
            }
            final descriptionValue =
                m['description'] ??
                contentMap?['content'] ??
                contentMap?['description'] ??
                (contentMap == null ? rawContent : null);
            final description = descriptionValue?.toString().trim();

            return MediaSlideItem(
              id: m['id'].toString(),
              title: m['title']?.toString() ?? '',
              subtitle: m['subtitle']?.toString(),
              arabicText: m['arabic_text'] ?? m['arabicText'],
              translationText: description,
              description: description?.isEmpty == true ? null : description,
              imagePath: _resolveStorageUrl(
                m['url'] ?? m['file_path'] ?? m['imagePath'],
              ),
              type: type,
              tableHeaders: headers,
              tableRows: rows,
              tableData: tableMap,
              durationSeconds:
                  m['duration_seconds'] ?? m['durationSeconds'] ?? 10,
            );
          }).toList();
        }

        final donasiData = apiData['donationSettings'];
        MediaSlideItem? donasiSlide;
        if (donasiData != null && donasiData['is_active'] != false) {
          donasiSlide = MediaSlideItem(
            id: 'donation_slide',
            title: donasiData['title'] ?? 'INFAQ & DONASI MASJID',
            subtitle:
                donasiData['description'] ??
                'Salurkan Infaq & Sedekah Terbaik Anda melalui QRIS / Transfer Bank Nagari',
            arabicText:
                donasiData['account_name'] ??
                'Bank Nagari 1002.0210.09881-1 a.n Masjid Al-Hidayah',
            imagePath: _resolveStorageUrl(
              donasiData['qr_code_path'] ?? donasiData['qr_code_url'],
            ),
            type: SlideType.donation,
            durationSeconds: 10,
          );
        }
        _mediaSlides = withDonationSlide(_mediaSlides, donasiSlide);

        final agendasList = apiData['agendas'] as List?;
        if (agendasList != null && agendasList.isNotEmpty) {
          for (var i = 0; i < agendasList.length; i++) {
            final a = agendasList[i];
            if (a['is_active'] != false) {
              final agendaSlide = MediaSlideItem(
                id: 'agenda_${a['id']}',
                title: (a['title'] ?? 'AGENDA MASJID').toString().toUpperCase(),
                subtitle: a['description'] ?? '',
                translationText: a['starts_at'] != null
                    ? 'Waktu Pelaksanaan: ${a['starts_at'].toString().split('T').first}'
                    : null,
                description: a['description']?.toString(),
                type: SlideType.announcement,
                durationSeconds: 10,
              );

              _mediaSlides ??= [];
              _mediaSlides!.removeWhere((s) => s.id == 'agenda_${a['id']}');
              _mediaSlides!.add(agendaSlide);
            }
          }
        }

        final sprint8Slides = ApiService.parseSprint8Slides(apiData);
        for (final slide in sprint8Slides) {
          _mediaSlides ??= [];
          _mediaSlides!.removeWhere((item) => item.id == slide.id);
          _mediaSlides!.add(slide);
        }

        final rtList = apiData['runningTexts'] as List?;
        if (rtList != null) {
          final textItems = rtList
              .map((t) => (t['text'] ?? '').toString().trim())
              .where((t) => t.isNotEmpty)
              .toList();
          _runningTextContent = textItems.join(' • ');
          if (rtList.isNotEmpty) {
            _runningTextSpeed = ((rtList.first['speed'] as num?)?.toInt() ?? 50)
                .clamp(10, 200);
          }
        }
        _checkSyuruqReminderMode();
      });
    }
  }

  void _playAdzanAudio() {
    final adzanConfig = _audioSettings?['adzan'];
    final isEnabled = adzanConfig?['is_enabled'] ?? true;
    if (!isEnabled) return;

    final customUrlRaw = adzanConfig?['custom_url']?.toString();
    final customUrl = _resolveStorageUrl(customUrlRaw);
    final volume = (adzanConfig?['volume'] as num?)?.toDouble() ?? 80.0;

    AudioEngineService.playAdzan(customUrl: customUrl, volume: volume);
  }

  void _playMurottalAudio() {
    final murottalConfig = _audioSettings?['murottal'];
    final isEnabled = murottalConfig?['is_enabled'] ?? true;
    if (!isEnabled) return;

    final customUrlRaw = murottalConfig?['custom_url']?.toString();
    final customUrl = _resolveStorageUrl(customUrlRaw);
    final volume = (murottalConfig?['volume'] as num?)?.toDouble() ?? 70.0;

    AudioEngineService.playMurottal(customUrl: customUrl, volume: volume);
  }

  void _playDzikirAudio({required bool isPagi}) {
    final key = isPagi ? 'dzikir_pagi' : 'dzikir_petang';
    final dzikirConfig = _audioSettings?[key];
    final isEnabled = dzikirConfig?['is_enabled'] ?? true;
    if (!isEnabled) return;

    final customUrlRaw = dzikirConfig?['custom_url']?.toString();
    final customUrl = _resolveStorageUrl(customUrlRaw);
    final volume = (dzikirConfig?['volume'] as num?)?.toDouble() ?? 75.0;

    AudioEngineService.playDzikir(
      isPagi: isPagi,
      customUrl: customUrl,
      volume: volume,
    );
  }

  bool _hasMurottalPlayedForCurrentPrayer = false;

  void _startClockTimer() {
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _currentTime = PrayerService.masjidTime(DateTime.now());
          _resetDailyAudioFlagsIfNeeded();
          _checkPostIqamahBlackoutExpiry();
          _updateScheduleAndNextPrayer();
          _checkSyuruqReminderMode();
          _checkAutoMurottalTrigger();
          _checkAutoAdzanTrigger();
          _checkAutoDzikirTrigger();
          _checkCountdownBeep();
        });
      }
    });
  }

  void _updateScheduleAndNextPrayer() {
    if (!_isApiScheduleLoaded) {
      _schedule = PrayerService.getTodaySchedule(
        isFriday: _currentTime.weekday == DateTime.friday,
        referenceTime: _currentTime,
      );
    }
    _nextPrayer = PrayerService.getNextPrayer(_schedule, _currentTime);
    if (_nextPrayer != null) {
      _nextPrayerCountdown = PrayerService.getCountdownToNextPrayer(
        _nextPrayer!,
        _currentTime,
      );
    }
  }

  void _checkSyuruqReminderMode() {
    final active = PrayerService.isSyuruqReminderActive(
      _schedule,
      _currentTime,
      enabled: _syuruqSettings?['is_enabled'] != false,
      durationMinutes:
          (_syuruqSettings?['durationMinutes'] as num?)?.toInt() ?? 15,
    );
    if (active && _currentMode == DisplayMode.normal) {
      _currentMode = DisplayMode.syuruq;
    } else if (!active && _currentMode == DisplayMode.syuruq) {
      _currentMode = DisplayMode.normal;
    }
  }

  void _checkAutoMurottalTrigger() {
    if (_nextPrayer == null) return;

    final murottalConfig = _audioSettings?['murottal'];
    final isEnabled = murottalConfig?['is_enabled'] ?? true;
    if (!isEnabled) return;

    final playBeforeMinutes =
        (murottalConfig?['play_before_minutes'] as num?)?.toInt() ?? 10;
    final remainingSecs = _nextPrayerCountdown.inSeconds;

    if (remainingSecs > 5 && remainingSecs <= playBeforeMinutes * 60) {
      if (!_hasMurottalPlayedForCurrentPrayer &&
          _currentMode == DisplayMode.normal &&
          !AudioEngineService.isPlaying) {
        _hasMurottalPlayedForCurrentPrayer = true;
        _playMurottalAudio();
      }
    } else if (remainingSecs <= 5) {
      if (_hasMurottalPlayedForCurrentPrayer) {
        _hasMurottalPlayedForCurrentPrayer = false;
        if (_currentMode != DisplayMode.adzan) {
          AudioEngineService.stop();
        }
      }
    }
  }

  void _checkAutoAdzanTrigger() {
    final prayer = PrayerService.findPrayerAtTime(_schedule, _currentTime);
    if (prayer == null || _currentMode != DisplayMode.normal) return;
    final key =
        '${prayer.time.year}-${prayer.time.month}-${prayer.time.day}-${prayer.name.name}';
    if (_lastTriggeredPrayerKey == key) return;
    _lastTriggeredPrayerKey = key;
    _activePrayer = prayer;
    _triggerAdzanMode();
  }

  DisplayMode _modeAfterAdzan() => PrayerService.modeAfterAdzan(
    _activePrayer,
    fridayEnabled: _fridaySettings?['is_enabled'] != false,
    disableFridayIqamah: _fridaySettings?['disable_iqamah_on_friday'] != false,
  );

  void _triggerAdzanMode() {
    _adzanTimer?.cancel();
    _fridayTimer?.cancel();
    setState(() {
      _currentMode = DisplayMode.adzan;
    });
    _playAdzanAudio();

    final durationSecs =
        (_adzanSettings?['durationSeconds'] as num?)?.toInt() ?? 180;
    _adzanTimer = Timer(Duration(seconds: durationSecs), () {
      if (mounted && _currentMode == DisplayMode.adzan) {
        AudioEngineService.stop();
        final nextMode = _modeAfterAdzan();
        setState(() => _currentMode = nextMode);
        if (nextMode == DisplayMode.fridayKhutbah) {
          final minutes =
              (_fridaySettings?['khutbah_duration_minutes'] as num?)?.toInt() ??
              35;
          _fridayTimer = Timer(Duration(minutes: minutes), () {
            if (mounted && _currentMode == DisplayMode.fridayKhutbah) {
              setState(() => _currentMode = DisplayMode.normal);
            }
          });
        }
      }
    });
  }

  void _startPostIqamahBlackout() {
    if (!mounted || _currentMode != DisplayMode.iqamah) return;
    _postIqamahBlackUntil = PrayerService.masjidTime(
      DateTime.now(),
    ).add(const Duration(minutes: 15));
    setState(() => _currentMode = DisplayMode.postIqamahBlack);
  }

  void _checkPostIqamahBlackoutExpiry() {
    if (_currentMode == DisplayMode.postIqamahBlack &&
        _postIqamahBlackUntil != null &&
        !_currentTime.isBefore(_postIqamahBlackUntil!)) {
      _postIqamahBlackUntil = null;
      _currentMode = DisplayMode.normal;
    }
  }

  bool _hasDzikirPagiPlayedToday = false;
  bool _hasDzikirPetangPlayedToday = false;

  void _resetDailyAudioFlagsIfNeeded() {
    final today = DateTime(
      _currentTime.year,
      _currentTime.month,
      _currentTime.day,
    );
    if (today == _audioFlagsDate) return;
    _audioFlagsDate = today;
    _hasDzikirPagiPlayedToday = false;
    _hasDzikirPetangPlayedToday = false;
    _hasMurottalPlayedForCurrentPrayer = false;
    _lastTriggeredPrayerKey = null;
  }

  /// 5-minute pre-adzan countdown is purely visual (rendered while in
  /// [DisplayMode.normal]) so it never blocks adzan/iqamah. Only real prayers
  /// with adzan — skip imsak (reminder) and syuruq (no prayer).
  bool get _isCountdownActive {
    if (_currentMode != DisplayMode.normal || _nextPrayer == null) return false;
    final n = _nextPrayer!.name;
    if (n == PrayerName.imsak || n == PrayerName.syuruq) return false;
    final secs = _nextPrayerCountdown.inSeconds;
    final minutes = PrayerService.countdownMinutesFor(n, _countdownSettings);
    return secs > 0 && secs <= minutes * 60;
  }

  void _checkCountdownBeep() {
    if (!_isCountdownActive) {
      _lastBeepSecond = -1;
      return;
    }
    final secs = _nextPrayerCountdown.inSeconds;
    if (secs <= 10 && secs > 0 && secs != _lastBeepSecond) {
      _lastBeepSecond = secs;
      AudioEngineService.playBeep();
    }
  }

  void _checkAutoDzikirTrigger() {
    final now = _currentTime;
    try {
      final subuhItem = _schedule.items.firstWhere(
        (i) => i.name == PrayerName.subuh,
      );
      final asharItem = _schedule.items.firstWhere(
        (i) => i.name == PrayerName.ashar,
      );
      final syuruqItem = _schedule.items.firstWhere(
        (i) => i.name == PrayerName.syuruq,
      );
      final maghribItem = _schedule.items.firstWhere(
        (i) => i.name == PrayerName.maghrib,
      );

      // Dzikir Pagi: 15 mins after Subuh until Syuruq
      final dzikirPagiStartTime = subuhItem.time.add(
        const Duration(minutes: 15),
      );
      if (now.isAfter(dzikirPagiStartTime) && now.isBefore(syuruqItem.time)) {
        if (!_hasDzikirPagiPlayedToday &&
            _currentMode == DisplayMode.normal &&
            !AudioEngineService.isPlaying) {
          _hasDzikirPagiPlayedToday = true;
          _playDzikirAudio(isPagi: true);
        }
      }

      // Dzikir Petang: 15 mins after Ashar until Maghrib
      final dzikirPetangStartTime = asharItem.time.add(
        const Duration(minutes: 15),
      );
      if (now.isAfter(dzikirPetangStartTime) &&
          now.isBefore(maghribItem.time)) {
        if (!_hasDzikirPetangPlayedToday &&
            _currentMode == DisplayMode.normal &&
            !AudioEngineService.isPlaying) {
          _hasDzikirPetangPlayedToday = true;
          _playDzikirAudio(isPagi: false);
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _apiPollTimer?.cancel();
    _adzanTimer?.cancel();
    _fridayTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _themeBackgroundColor,
      body: Stack(
        children: [
          // Background Gradient & Geometric Glow Ambient / Custom Background Image
          Positioned.fill(
            child:
                _backgroundUrl != null &&
                    _backgroundUrl!.isNotEmpty &&
                    _backgroundUrl!.startsWith('http')
                ? Image.network(
                    _backgroundUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _themeBackgroundColor,
                            Color.alphaBlend(
                              Colors.black.withOpacity(0.3),
                              _themeBackgroundColor,
                            ),
                            _themeBackgroundColor,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                    ),
                  )
                : Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          _themeBackgroundColor,
                          Color.alphaBlend(
                            Colors.black.withOpacity(0.35),
                            _themeBackgroundColor,
                          ),
                          _themeBackgroundColor,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
          ),

          // Main 16:9 Fullscreen Layout
          SafeArea(
            top: false,
            child: Column(
              children: [
                // Top Header Bar
                Padding(
                  padding: const EdgeInsets.only(
                    left: 16,
                    right: 16,
                    top: 0,
                    bottom: 6,
                  ),
                  child: HeaderBar(
                    currentTime: _currentTime,
                    mosqueName: _mosqueName,
                    mosqueAddress: _mosqueAddress,
                    hijriCorrectionDays: _hijriCorrectionDays,
                    logoUrl: _logoUrl,
                    primaryColor: _themePrimaryColor,
                    secondaryColor: _themeSecondaryColor,
                    textColor: _themeTextColor,
                  ),
                ),

                // Center Main Content Area
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Left: Media Carousel (full width — right panel removed)
                        Expanded(
                          child: MediaCarousel(
                            items: _mediaSlides,
                            isPaused:
                                _currentMode == DisplayMode.adzan ||
                                _currentMode == DisplayMode.iqamah,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom Prayer Cards Row (Hidden in Minimal Layout Mode)
                if (_layoutMode != 'minimal')
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 3,
                    ),
                    child: PrayerScheduleRow(
                      schedule: _schedule,
                      nextPrayer: _nextPrayer,
                      nextPrayerCountdown: _nextPrayerCountdown,
                      primaryColor: _themePrimaryColor,
                      secondaryColor: _themeSecondaryColor,
                      textColor: _themeTextColor,
                    ),
                  ),
                const SizedBox(height: 4),

                // Bottom Running Text Bar
                if (_runningTextContent.isNotEmpty)
                  RunningTextBar(
                    text: _runningTextContent,
                    speed: _runningTextSpeed,
                    primaryColor: _themePrimaryColor,
                    backgroundColor: _themeBackgroundColor,
                    textColor: _themeTextColor,
                  ),
              ],
            ),
          ),

          // Active Overlays based on _currentMode
          if (_currentMode == DisplayMode.postIqamahBlack)
            const Positioned.fill(child: ColoredBox(color: Colors.black)),
          if (_isCountdownActive)
            CountdownOverlay(
              prayerName: _nextPrayer!.name.displayName,
              remaining: _nextPrayerCountdown,
              total: Duration(
                minutes: PrayerService.countdownMinutesFor(
                  _nextPrayer!.name,
                  _countdownSettings,
                ),
              ),
            ),
          if (_currentMode == DisplayMode.adzan)
            AdzanOverlay(
              prayerName: _activePrayer?.name.displayName ?? 'MAGHRIB',
              displayMessage: _adzanSettings?['displayMessage'],
            ),
          if (_currentMode == DisplayMode.iqamah)
            IqamahOverlay(
              prayerName: _activePrayer?.name.displayName ?? 'MAGHRIB',
              totalMinutes: _activePrayer?.iqamahDurationMinutes ?? 10,
              onFinished: _startPostIqamahBlackout,
            ),
          if (_currentMode == DisplayMode.syuruq)
            SyuruqOverlay(
              durationMinutes:
                  (_syuruqSettings?['durationMinutes'] as num?)?.toInt() ?? 15,
              displayMessage:
                  _syuruqSettings?['displayMessage']?.toString() ??
                  'Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha',
            ),
          if (_currentMode == DisplayMode.fridayKhutbah)
            FridayKhutbahOverlay(
              title:
                  _fridaySettings?['khutbah_title'] ??
                  "SELAMAT MENUNAIKAN SHALAT JUM'AT",
              message:
                  _fridaySettings?['khutbah_message'] ??
                  "Harap mendengarkan Khutbah Jum'at dengan khusyuk",
              khatibName: _fridaySettings?['khatib_name'],
              imamName: _fridaySettings?['imam_name'],
              themeTitle: _fridaySettings?['theme_title'],
            ),
          if (_currentMode == DisplayMode.mediaFullscreen)
            const MediaFullscreenOverlay(),
        ],
      ),
    );
  }
}
