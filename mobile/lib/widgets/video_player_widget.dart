import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';

class LocalVideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final String title;
  final String? subtitle;
  final VoidCallback? onVideoEnded;

  const LocalVideoPlayerWidget({
    super.key,
    required this.videoUrl,
    required this.title,
    this.subtitle,
    this.onVideoEnded,
  });

  @override
  State<LocalVideoPlayerWidget> createState() => _LocalVideoPlayerWidgetState();
}

class _LocalVideoPlayerWidgetState extends State<LocalVideoPlayerWidget> {
  VideoPlayerController? _controller;
  String? _error;
  bool _ended = false;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final uri = Uri.tryParse(widget.videoUrl);
    if (uri == null || !uri.hasScheme) {
      setState(() => _error = 'URL video tidak valid');
      return;
    }

    final controller = VideoPlayerController.networkUrl(uri);
    _controller = controller;
    controller.addListener(_handlePlayback);
    try {
      await controller.initialize();
      await controller.setLooping(false);
      await controller.play();
      if (mounted) setState(() {});
    } catch (_) {
      if (mounted) setState(() => _error = 'Video gagal diputar');
    }
  }

  void _handlePlayback() {
    final value = _controller?.value;
    if (value == null || !value.isCompleted || _ended) return;
    _ended = true;
    widget.onVideoEnded?.call();
  }

  @override
  void dispose() {
    final controller = _controller;
    controller?.removeListener(_handlePlayback);
    controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    if (_error != null) return _status(_error!);
    if (controller == null || !controller.value.isInitialized) {
      return _status('Memuat video...');
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: ColoredBox(
        color: Colors.black,
        child: Center(
          child: AspectRatio(
            aspectRatio: controller.value.aspectRatio,
            child: VideoPlayer(controller),
          ),
        ),
      ),
    );
  }

  Widget _status(String message) => Container(
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
          Icons.movie_creation_rounded,
          color: Color(0xFF38BDF8),
          size: 48,
        ),
        const SizedBox(height: 12),
        Text(
          widget.title.isNotEmpty ? widget.title : 'VIDEO SLIDE',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          message,
          style: GoogleFonts.inter(
            color: const Color(0xFF94A3B8),
            fontSize: 14,
          ),
        ),
      ],
    ),
  );
}
