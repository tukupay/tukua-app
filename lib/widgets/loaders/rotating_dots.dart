import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:tuku/constants/constants.dart';
class RotatingDots extends StatelessWidget {
  const RotatingDots({super.key});

  @override
  Widget build(BuildContext context) {
    return LoadingAnimationWidget.fourRotatingDots(
        color: HexColor(AppColors.primaryGreen),
        size: 36);
  }
}
