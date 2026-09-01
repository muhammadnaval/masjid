enum DisplayMode {
  normal,
  adzan,
  iqamah,
  postIqamahBlack,
  syuruq,
  fridayKhutbah,
  mediaFullscreen,
}

extension DisplayModePriority on DisplayMode {
  int get priority {
    switch (this) {
      case DisplayMode.adzan:
        return 100;
      case DisplayMode.iqamah:
        return 90;
      case DisplayMode.postIqamahBlack:
        return 85;
      case DisplayMode.syuruq:
        return 80;
      case DisplayMode.fridayKhutbah:
        return 70;
      case DisplayMode.mediaFullscreen:
        return 50;
      case DisplayMode.normal:
        return 10;
    }
  }
}

enum PrayerName { imsak, subuh, syuruq, dzuhur, jumat, ashar, maghrib, isya }

extension PrayerNameExtension on PrayerName {
  String get displayName {
    switch (this) {
      case PrayerName.imsak:
        return 'IMSAK';
      case PrayerName.subuh:
        return 'SUBUH';
      case PrayerName.syuruq:
        return 'SYURUQ';
      case PrayerName.dzuhur:
        return 'DZUHUR';
      case PrayerName.jumat:
        return 'JUM\'AT';
      case PrayerName.ashar:
        return 'ASHAR';
      case PrayerName.maghrib:
        return 'MAGHRIB';
      case PrayerName.isya:
        return 'ISYA';
    }
  }
}
