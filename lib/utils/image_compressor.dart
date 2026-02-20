import 'dart:io';
import 'package:image/image.dart' as img;
import 'package:flutter/foundation.dart';
/// Compresses an image [inputFile] to approximately 1MB or less.
/// Returns a new compressed [File].
Future<File?> compressImage(File inputFile, {int maxSizeInBytes = 1000000}) async {
  try {
    final bytes = await inputFile.readAsBytes();
    final img.Image? original = img.decodeImage(bytes);
    if (original == null) return null;

    // Resize: max width or height = 1080
    final img.Image resized = img.copyResize(original, width: 1080);

    int quality = 90;
    Uint8List compressedBytes = Uint8List.fromList(img.encodeJpg(resized, quality: quality));

    while (compressedBytes.lengthInBytes > maxSizeInBytes && quality > 30) {
      quality -= 10;
      compressedBytes = Uint8List.fromList(img.encodeJpg(resized, quality: quality));
    }

    final compressedPath = inputFile.path.replaceFirst(RegExp(r'\.jpe?g$'), '-compressed.jpeg');
    final compressedFile = File(compressedPath);
    await compressedFile.writeAsBytes(compressedBytes);

    return compressedFile;
  } catch (e) {
    debugPrint('❌ compressImage() failed: $e');
    return null;
  }
}
