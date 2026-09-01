enum SlideType {
  welcome,
  announcement,
  hadith,
  dakwahText,

  kasTable,
  infoTable,
  donation,
  image,
  video,
  youtube,
  livestream,
}

List<MediaSlideItem> withDonationSlide(
  List<MediaSlideItem>? items,
  MediaSlideItem? donation,
) {
  return [...?items?.where((item) => item.id != 'donation_slide'), ?donation];
}

class MediaSlideItem {
  final String id;
  final String title;
  final SlideType type;
  final String? subtitle;
  final String? arabicText;
  final String? translationText;
  final String? description;
  final String? imagePath;
  final Map<String, dynamic>? tableData;
  final List<String>? tableHeaders;
  final List<List<String>>? tableRows;
  final int durationSeconds;

  MediaSlideItem({
    required this.id,
    required this.title,
    required this.type,
    this.subtitle,
    this.arabicText,
    this.translationText,
    this.description,
    this.imagePath,
    this.tableData,
    this.tableHeaders,
    this.tableRows,
    this.durationSeconds = 8,
  });
}
