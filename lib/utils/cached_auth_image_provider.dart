import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import '../services/auth_http.dart';

/// A custom image provider that caches authenticated images and handles token refresh
class CachedAuthImageProvider extends ImageProvider<CachedAuthImageProvider> {
  final String imageUrl;
  final double scale;
  final AuthHttp _authHttp = AuthHttp();

  CachedAuthImageProvider(this.imageUrl, {this.scale = 1.0});

  @override
  Future<CachedAuthImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture<CachedAuthImageProvider>(this);
  }

  @override
  ImageStreamCompleter loadImage(
      CachedAuthImageProvider key, ImageDecoderCallback decode) {
    return MultiFrameImageStreamCompleter(
      codec: _loadAsync(key, decode),
      scale: key.scale,
      debugLabel: key.imageUrl,
      informationCollector: () sync* {
        yield DiagnosticsProperty<ImageProvider>('Image provider', this);
        yield DiagnosticsProperty<CachedAuthImageProvider>('Image key', key);
      },
    );
  }

  Future<ui.Codec> _loadAsync(
      CachedAuthImageProvider key, ImageDecoderCallback decode) async {
    try {
      // Try to load from cache first
      final cachedFile = await _getCachedFile(key.imageUrl);

      if (await cachedFile.exists()) {
        final bytes = await cachedFile.readAsBytes();
        if (bytes.isNotEmpty) {
          debugPrint('Loading image from cache: ${key.imageUrl}');
          final buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
          return decode(buffer);
        }
      }

      // If not in cache or cache is empty, download with token
      debugPrint('Downloading image with auth: ${key.imageUrl}');
      final bytes = await _downloadImage(key.imageUrl);

      if (bytes.isNotEmpty) {
        // Save to cache
        await cachedFile.writeAsBytes(bytes);
        debugPrint('Image cached: ${key.imageUrl}');

        final buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
        return decode(buffer);
      }

      throw Exception('Failed to load image: empty response');
    } catch (e) {
      debugPrint('Error loading image: $e');
      rethrow;
    }
  }

  /// Download image with authentication token
  Future<Uint8List> _downloadImage(String url) async {
    final uri = Uri.parse(url);

    // Check if this is a pre-signed URL (AWS S3, etc.)
    // These URLs have authentication in query params and don't need Bearer token
    final isPresignedUrl = uri.queryParameters.containsKey('Signature') ||
                            uri.queryParameters.containsKey('X-Amz-Signature') ||
                            uri.queryParameters.containsKey('AWSAccessKeyId');

    http.Response response;

    if (isPresignedUrl) {
      // For pre-signed URLs, use direct HTTP GET without auth headers
      debugPrint('Using pre-signed URL authentication');
      response = await http.get(uri);
    } else {
      // For regular authenticated endpoints, use AuthHttp with Bearer token
      debugPrint('Using Bearer token authentication');
      final token = await _authHttp.token();

      if (token == null) {
        throw Exception('No authentication token available');
      }

      response = await _authHttp.get(uri);

      // Retry once if unauthorized (token might have expired)
      if (response.statusCode == 401) {
        debugPrint('Image download returned 401, retrying...');
        response = await _authHttp.get(uri);
      }
    }

    if (response.statusCode == 200) {
      return response.bodyBytes;
    } else {
      throw Exception('Failed to download image: ${response.statusCode}');
    }
  }

  /// Get the cached file path
  Future<File> _getCachedFile(String url) async {
    final directory = await getTemporaryDirectory();
    final cacheDir = Directory('${directory.path}/image_cache');

    if (!await cacheDir.exists()) {
      await cacheDir.create(recursive: true);
    }

    // Create a unique filename from the URL
    final filename = _generateCacheKey(url);
    return File('${cacheDir.path}/$filename');
  }

  /// Generate a cache key from the URL
  String _generateCacheKey(String url) {
    final bytes = utf8.encode(url);
    final digest = md5.convert(bytes);
    return digest.toString();
  }

  @override
  bool operator ==(Object other) {
    if (other.runtimeType != runtimeType) return false;
    return other is CachedAuthImageProvider &&
        other.imageUrl == imageUrl &&
        other.scale == scale;
  }

  @override
  int get hashCode => Object.hash(imageUrl, scale);

  @override
  String toString() =>
      '${objectRuntimeType(this, 'CachedAuthImageProvider')}("$imageUrl", scale: $scale)';
}

/// Helper widget for easy use
class CachedAuthImage extends StatelessWidget {
  final String imageUrl;
  final BoxFit? fit;
  final double? width;
  final double? height;
  final Widget? placeholder;
  final Widget? errorWidget;

  const CachedAuthImage({
    super.key,
    required this.imageUrl,
    this.fit,
    this.width,
    this.height,
    this.placeholder,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Image(
      image: CachedAuthImageProvider(imageUrl),
      fit: fit,
      width: width,
      height: height,
      frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
        if (wasSynchronouslyLoaded || frame != null) {
          return child;
        }
        return placeholder ??
            Center(
              child: SizedBox(
                width: 30,
                height: 30,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
      },
      errorBuilder: (context, error, stackTrace) {
        debugPrint('Error loading image: $error');
        return errorWidget ??
            Center(
              child: Icon(Icons.broken_image, size: 50, color: Colors.grey),
            );
      },
    );
  }
}

