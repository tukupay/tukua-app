import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

class Camera extends StatefulWidget {
  const Camera({super.key});

  @override
  State<Camera> createState() => _CameraState();
}

class _CameraState extends State<Camera> {
  final GlobalKey _idKeyFrame = GlobalKey(); // Key for locating ID/Face frame
  Rect? _idRect; // Stores the position of the overlay frame (used for cropping)

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final kyc = Provider.of<TukuIndividualKycProvider>(context, listen: false);
      final cameraProvider =
          Provider.of<CameraProvider>(context, listen: false);
      await cameraProvider.initializeCamera(isFront: kyc.isSelfie);
    });
  }

  @override
  void dispose() {
    // The camera controller is now disposed in PopScope or the provider itself.
    // Calling it here can cause issues if the user navigates back.
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return PopScope(
      // Use canPop and onPopInvoked for modern PopScope behavior
      canPop: true,
      onPopInvoked: (didPop) {
        if (didPop) {
          // Clean up when the user navigates away
          Provider.of<TukuIndividualKycProvider>(context, listen: false).resetIsSelfie();
          Provider.of<CameraProvider>(context, listen: false).disposeController();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Consumer2<CameraProvider, TukuIndividualKycProvider>(
          builder: (_, camera, kyc, __) {
            if (!camera.isInitialized) {
              // checking & initializing cameras
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Setting up your camera...',
                        style: Grays.smallestPoppinsHint),
                    Spaces.smallTopSpace,
                    CircularProgressIndicator(
                        color: HexColor(AppColors.primaryGreen)),
                  ],
                ),
              );
            }

            // adjust camera preview scale to fill screen
            final scale =
                1 / (camera.controller!.value.aspectRatio * size.aspectRatio);

            return Stack(
              children: [
                GestureDetector(
                  onTapDown: (details) {
                    final tapPosition = details.localPosition;
                    final normalizedOffset = Offset(
                      tapPosition.dx / size.width,
                      tapPosition.dy / size.height,
                    );
                    camera.controller?.setFocusPoint(normalizedOffset);
                  },
                  child: Center(
                    child: Transform.scale(
                      scale: scale,
                      child: CameraPreview(camera.controller!),
                    ),
                  ),
                ),

                // Mask overlay with transparent cut-out around frame
                LayoutBuilder(
                  builder: (context, constraints) {
                    // Use addPostFrameCallback to get the frame's position after it has been laid out.
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (!mounted) return;
                      final box = _idKeyFrame.currentContext?.findRenderObject()
                          as RenderBox?;
                      if (box != null) {
                        final offset = box.localToGlobal(Offset.zero);
                        final size = box.size;
                        final newRect = Rect.fromLTWH(
                            offset.dx, offset.dy, size.width, size.height);
                        // Only update state if the rect has actually changed to avoid unnecessary rebuilds
                        if (_idRect != newRect) {
                          setState(() {
                            _idRect = newRect;
                          });
                        }
                      }
                    });
                    return CustomPaint(
                      size: constraints.biggest,
                      // Only draw the painter if the rect is available and it's not a selfie
                      painter: _idRectAvailable(kyc.isSelfie)
                          ? IDOverlayPainter(focusRect: _idRect!)
                          : null,
                    );
                  },
                ),

                // Overlay frame (either face or ID guide)
                Align(
                  alignment: Alignment.center,
                  child: Container(
                    key: _idKeyFrame,
                    width: kyc.isSelfie
                        ? 220
                        : 300, // Face frame is circular and smaller
                    height: kyc.isSelfie ? 300 : 180,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 2),
                      // Make the selfie frame a circle
                      borderRadius: BorderRadius.circular(kyc.isSelfie ? 150 : 12),
                    ),
                  ),
                ),

                // Hint text for user
                Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 75),
                    child: Text(
                      kyc.isSelfie
                          ? "Align your face within the circle"
                          : kyc.isFrontId
                              ? "Align the Front of your ID within the frame"
                              : "Align the Back of your ID within the frame",
                      style: Whites.regularSemiRoboto,
                    ),
                  ),
                ),
                // Capture button
                Align(

                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const SizedBox(height: 24), // Maintain consistent space
                        Spaces.mediumTopSpace,
                        FloatingActionButton(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(100),
                          ),
                          backgroundColor: HexColor(AppColors.primaryGreen),
                          onPressed: (camera.isCapturing || camera.isCropping)
                              ? null
                              : () async {
                                  final cameraProvider =
                                      Provider.of<CameraProvider>(context,
                                          listen: false);
                                  final kycProvider =
                                      Provider.of<TukuIndividualKycProvider>(
                                          context,
                                          listen: false);

                                  bool success =
                                      await cameraProvider.captureAndProcessImage(
                                    isSelfie: kycProvider.isSelfie,
                                    cropRect: _idRect,
                                    screenSize: MediaQuery.of(context).size,
                                  );

                                  if (mounted && success) {
                                    Navigator.pushNamed(context, Routes.capturedImg);
                                  }
                                },
                          child: const Icon(Icons.camera, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),

                // --- NEW: Full-screen loading overlay ---
                if (camera.isCapturing || camera.isCropping)
                  Container(
                    color: Colors.black.withOpacity(0.7),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(
                              color: HexColor(AppColors.primaryGreen)),
                          Spaces.mediumTopSpace,
                          if (camera.isCapturing)
                            Text('Capturing...', style: Whites.regularSemiRoboto)
                          else
                            Column(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                                  child: LinearProgressIndicator(
                                    value: camera.processProgress > 0 ? camera.processProgress / 100 : null,
                                    minHeight: 6.0,
                                    color: HexColor(AppColors.primaryGreen),
                                    backgroundColor: Colors.grey.shade800,
                                  ),
                                ),
                                Spaces.smallTopSpace,
                                Text('Finalizing... ${camera.processProgress}%', style: Whites.regularSemiRoboto),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  bool _idRectAvailable(bool isSelfie) => !isSelfie && _idRect != null;
}

// --- No changes needed for IDOverlayPainter ---
class IDOverlayPainter extends CustomPainter {
  final Rect focusRect;
  IDOverlayPainter({required this.focusRect});

  @override
  void paint(Canvas canvas, Size size) {
    final overlayPaint = Paint()..color = Colors.black.withAlpha(205);
    final clearPaint = Paint()..blendMode = BlendMode.clear;

    canvas.saveLayer(Offset.zero & size, Paint());
    canvas.drawRect(Offset.zero & size, overlayPaint);
    canvas.drawRect(focusRect, clearPaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
