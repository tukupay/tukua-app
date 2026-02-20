import 'dart:io';
import 'dart:ui';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import '../utils/image_cropper.dart';
import 'package:image/image.dart' as img;
import 'dart:isolate';
import 'dart:typed_data';
import 'dart:async';

class CameraProvider extends ChangeNotifier{

  CameraController? _controller;
  CameraController? get controller=>_controller;

  late Future<void> _initializeController;

  bool get isInitialized=>_controller!=null && _controller!.value.isInitialized;

  File? _capturedSelfie;
  File? get capturedSelfie=>_capturedSelfie;

  File? _capturedId;
  File? get capturedId=>_capturedId;

  bool _isCapturing=false;
  bool get isCapturing=>_isCapturing;

  bool _isCropping=false;
  bool get isCropping=>_isCropping;

  int _processProgress = 0;
  int get processProgress => _processProgress;

  Isolate? _processingIsolate;

  Future<void> initializeCamera({bool? isFront})async{
    final cameras=await availableCameras();
    if(isFront==true){
      _controller=CameraController(
          cameras.last,
          ResolutionPreset.max,
          enableAudio: false);
    }else{
      _controller=CameraController(
          cameras.first,
          ResolutionPreset.max,
          enableAudio: false);
    }
    debugPrint('CAMERA ${_controller?.cameraId} INITIALIZED');
    _initializeController=_controller!.initialize();
    await _controller!.setFocusMode(FocusMode.auto);
    await _initializeController;
    notifyListeners();
  }

  Future<void> captureImage()async{
    _isCapturing=true;
    notifyListeners();
    if(!isInitialized)return;
    final rawFile=await _controller?.takePicture();
    if(rawFile==null)return;
    _capturedSelfie=File(rawFile.path);
    _isCapturing=false;
    notifyListeners();
  }

  Future<void> resetCapturedSelfie()async{
    _capturedSelfie=null;
    notifyListeners();
  }


  void setCapturedId(String imgPath){
    _capturedId=File(imgPath);
    notifyListeners();
  }

  void resetCapturedId(){
    _capturedId=null;
    notifyListeners();
  }

  // This centralizes the capture and crop logic.
  Future<bool> captureAndProcessImage({
    required bool isSelfie,
    Rect? cropRect,
    Size? screenSize,
  }) async {
    if (controller == null || !controller!.value.isInitialized) {
      // Handle error: Camera not ready
      return false;
    }

    _isCapturing = true;
    notifyListeners();

    try {
      // 1. Capture the image
      final XFile imageFile = await controller!.takePicture();
      _isCapturing = false;
      // Keep capturing flag until processing starts; set cropping flag when cropping
      if (!isSelfie && cropRect != null && screenSize != null) {
        _isCropping = true;
        notifyListeners();

        final File? croppedFile = await cropToOverlayArea(
          capturedFile: imageFile,
          overlayRect: cropRect,
          screenSize: screenSize,
        );

        if (croppedFile != null) {
          _capturedId = File(croppedFile.path);
        } else {
          // Cropping failed
          _isCropping = false;
          notifyListeners();
          return false;
        }

      } else {
        // It's a selfie or cropping is not needed, just store the result
        _capturedSelfie = File(imageFile.path);
      }

      _isCropping = false;
      _isCapturing = false;
      notifyListeners();
      return true; // Success

    } catch (e) {
      // Handle any exception during capture or processing
      debugPrint("Error capturing/processing image: $e");
      _isCapturing = false;
      _isCropping = false;
      notifyListeners();
      return false; // Failure
    }
  }

  /// Entry point for the spawned isolate. Sends periodic progress updates and
  /// finally sends the resulting encoded bytes back to the main isolate.
  static void _isolateProcessEntry(Map<String, dynamic> message) {
    final SendPort sendPort = message['sendPort'] as SendPort;
    final List<int> imageBytes = message['imageBytes'] as List<int>;
    final Map overlay = message['overlay'] as Map;
    final Map screen = message['screen'] as Map;

    try {
      // 1. Notify decode start
      sendPort.send({'progress': 5});

      final img.Image? originalImage = img.decodeImage(Uint8List.fromList(imageBytes));
      if (originalImage == null) {
        sendPort.send({'error': 'decode_failed'});
        return;
      }

      // Notify decode complete
      sendPort.send({'progress': 30});

      final int imageWidth = originalImage.width;
      final int imageHeight = originalImage.height;

      final double scaleX = imageWidth / (screen['width'] as double);
      final double scaleY = imageHeight / (screen['height'] as double);

      final int cropX = ((overlay['left'] as double) * scaleX).toInt();
      final int cropY = ((overlay['top'] as double) * scaleY).toInt();
      final int cropW = ((overlay['width'] as double) * scaleX).toInt();
      final int cropH = ((overlay['height'] as double) * scaleY).toInt();

      // clamp crop rect to image bounds
      final int x = cropX.clamp(0, imageWidth - 1);
      final int y = cropY.clamp(0, imageHeight - 1);
      final int w = cropW.clamp(0, imageWidth - x);
      final int h = cropH.clamp(0, imageHeight - y);

      // Notify before cropping
      sendPort.send({'progress': 55});

      final img.Image croppedImage = img.copyCrop(originalImage, x: x, y: y, width: w, height: h);

      // Notify after cropping
      sendPort.send({'progress': 80});

      final List<int> encoded = img.encodeJpg(croppedImage, quality: 95);

      // Final progress and send result
      sendPort.send({'progress': 100});
      sendPort.send({'done': Uint8List.fromList(encoded)});
    } catch (e) {
      sendPort.send({'error': e.toString()});
    }
  }

  // Crop to only visible overlay area (for IDs)
  Future<File?> cropToOverlayArea({
    required XFile capturedFile,
    required Rect overlayRect,
    required Size screenSize,
  }) async {
    ReceivePort? rp;
    try {
      // Read bytes asynchronously
      final imageBytes = await capturedFile.readAsBytes();

      // Prepare args for isolate processing
      final args = {
        'imageBytes': imageBytes,
        'overlay': {
          'left': overlayRect.left,
          'top': overlayRect.top,
          'width': overlayRect.width,
          'height': overlayRect.height,
        },
        'screen': {
          'width': screenSize.width,
          'height': screenSize.height,
        }
      };

      rp = ReceivePort();
      // Spawn isolate
      _processingIsolate = await Isolate.spawn(_isolateProcessEntry, {
        'sendPort': rp.sendPort,
        'imageBytes': args['imageBytes'],
        'overlay': args['overlay'],
        'screen': args['screen'],
      }, onError: rp.sendPort, onExit: rp.sendPort);

      final Completer<Uint8List?> completer = Completer<Uint8List?>();

      // Listen for progress and result messages
      rp.listen((message) async {
        if (message is Map) {
          if (message.containsKey('progress')) {
            final int p = message['progress'] as int;
            _processProgress = p.clamp(0, 100);
            notifyListeners();
          } else if (message.containsKey('done')) {
            final Uint8List bytes = message['done'] as Uint8List;
            if (!completer.isCompleted) completer.complete(bytes);
          } else if (message.containsKey('error')) {
            if (!completer.isCompleted) completer.completeError(message['error']);
          }
        } else if (message == null) {
          // isolate exit
          // ignore
        }
      });

      // Wait for the isolate result (or error)
      Uint8List? resultBytes;
      try {
        resultBytes = await completer.future;
      } catch (e) {
        // Ensure progress reset
        _processProgress = 0;
        notifyListeners();
        rp.close();
        _processingIsolate?.kill(priority: Isolate.immediate);
        _processingIsolate = null;
        return null;
      }

      if (resultBytes==null|| resultBytes.isEmpty) return null;

      // Write file asynchronously to avoid blocking UI
      final File outFile = File(capturedFile.path);
      await outFile.writeAsBytes(resultBytes);

      // Reset progress after successful write
      _processProgress = 0;
      notifyListeners();

      // cleanup
      rp.close();
      _processingIsolate?.kill(priority: Isolate.immediate);
      _processingIsolate = null;

      return outFile;

    } catch (e) {
      debugPrint("Error during image cropping: $e");
      if (rp != null) rp.close();
      _processingIsolate?.kill(priority: Isolate.immediate);
      _processingIsolate = null;
      _processProgress = 0;
      notifyListeners();
      return null;
    }
  }

  void disposeController(){
    _controller?.dispose();
    _controller=null;
    notifyListeners();
  }
}