import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;

class CropParams {
  final Uint8List bytes;
  final Rect overlayRect;
  final Size screenSize;
  final Size previewSize;

  CropParams({
    required this.bytes,
    required this.overlayRect,
    required this.screenSize,
    required this.previewSize,
  });
}

Future<Uint8List?> cropImageInIsolate(CropParams params) async {
  try {
    final img.Image? fullImage = img.decodeImage(params.bytes);
    if (fullImage == null) return null;

    final aspectRatio = params.previewSize.height / params.previewSize.width;
    final renderedHeight = params.screenSize.width * aspectRatio;
    final verticalOffset = (params.screenSize.height - renderedHeight) / 2;

    final scaleX = fullImage.width / params.screenSize.width;
    final scaleY = fullImage.height / renderedHeight;

    final cropX = (params.overlayRect.left * scaleX).round();
    final cropY = ((params.overlayRect.top - verticalOffset) * scaleY).round();
    final cropW = (params.overlayRect.width * scaleX).round();
    final cropH = (params.overlayRect.height * scaleY).round();

    final safeX = cropX.clamp(0, fullImage.width - 1);
    final safeY = cropY.clamp(0, fullImage.height - 1);
    final safeW = cropW.clamp(0, fullImage.width - safeX);
    final safeH = cropH.clamp(0, fullImage.height - safeY);

    final cropped = img.copyCrop(
      fullImage,
      x: safeX,
      y: safeY,
      width: safeW,
      height: safeH,
    );

    // compress to at least 1MB
    int quality=95;
    Uint8List encoded=Uint8List.fromList(img.encodeJpg(cropped,quality: quality));
    while (encoded.lengthInBytes>1000000 && quality>30){
      quality -= 5;
      encoded=Uint8List.fromList(img.encodeJpg(cropped,quality: quality));
    }
    return encoded;
  } catch (e) {
    debugPrint("\u274c isolate crop fail: $e");
    return null;
  }
}
