import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

class YouTubePlayerWidget extends StatefulWidget {
  final String videoUrl;
  final String title;
  final String? subtitle;
  final VoidCallback? onVideoEnded;
  final bool isLive;

  const YouTubePlayerWidget({
    super.key,
    required this.videoUrl,
    required this.title,
    this.subtitle,
    this.onVideoEnded,
    this.isLive = false,
  });

  static String extractYouTubeId(String rawUrl) {
    if (RegExp(r'^[\w-]{11}$').hasMatch(rawUrl)) return rawUrl;
    final uri = Uri.tryParse(rawUrl);
    if (uri == null) return '';
    if (uri.host.contains('youtu.be')) {
      return uri.pathSegments.firstOrNull ?? '';
    }
    if (uri.host.contains('youtube.com')) {
      if (uri.queryParameters['v'] case final String id) return id;
      final index = uri.pathSegments.indexWhere(
        (segment) =>
            segment == 'embed' || segment == 'live' || segment == 'shorts',
      );
      if (index >= 0 && index + 1 < uri.pathSegments.length) {
        return uri.pathSegments[index + 1];
      }
    }
    return '';
  }

  @override
  State<YouTubePlayerWidget> createState() => _YouTubePlayerWidgetState();
}

class _YouTubePlayerWidgetState extends State<YouTubePlayerWidget> {
  YoutubePlayerController? _controller;
  StreamSubscription<YoutubePlayerValue>? _subscription;
  bool _ended = false;

  @override
  void initState() {
    super.initState();
    final id = YouTubePlayerWidget.extractYouTubeId(widget.videoUrl);
    if (id.isEmpty) return;
    _controller = YoutubePlayerController.fromVideoId(
      videoId: id,
      autoPlay: true,
      params: const YoutubePlayerParams(
        enableCaption: false,
        showFullscreenButton: false,
      ),
    );
    _subscription = _controller!.stream.listen(_handlePlayback);
  }

  void _handlePlayback(YoutubePlayerValue value) {
    if (value.playerState != PlayerState.ended || _ended) {
      return;
    }
    _ended = true;
    widget.onVideoEnded?.call();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _controller?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    if (controller == null) return _invalidUrl();

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: YoutubePlayer(
        controller: controller,
        backgroundColor: Colors.black,
        autoFullScreen: false,
      ),
    );
  }

  Widget _invalidUrl() => Container(
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF334155)),
    ),
    alignment: Alignment.center,
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(
          Icons.video_camera_back_rounded,
          color: Color(0xFFEF4444),
          size: 48,
        ),
        const SizedBox(height: 12),
        Text(
          widget.title.isNotEmpty ? widget.title : 'YOUTUBE VIDEO',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'URL YouTube tidak valid',
          style: GoogleFonts.inter(
            color: const Color(0xFF94A3B8),
            fontSize: 14,
          ),
        ),
      ],
    ),
  );
}
