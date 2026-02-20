import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
class AiAnalysisAlert extends StatefulWidget {
  final IconData? icon;
  final String? action;
  const AiAnalysisAlert({super.key,
    this.icon,
  this.action});

  @override
  State<AiAnalysisAlert> createState() => _AiAnalysisAlertState();
}

class _AiAnalysisAlertState extends State<AiAnalysisAlert>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;


  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _colorAnimation = TweenSequence<Color?>(
      [
        TweenSequenceItem(
          tween: ColorTween(begin: HexColor('#19762A'), end: Colors.pink),
          weight: 1,
        ),
        TweenSequenceItem(
          tween: ColorTween(begin: Colors.pink, end: Colors.grey.shade300),
          weight: 1,
        ),
        TweenSequenceItem(
          tween: ColorTween(begin: Colors.grey.shade300, end: HexColor('#19762A')),
          weight: 1,
        ),
      ],
    ).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return AlertDialog(
      contentPadding: EdgeInsets.zero,
      elevation: 0,
      backgroundColor: Colors.white,
      content: Container(
        height: 250,
        width: size.width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Spinner + Animated Icon
            SizedBox(
              height: 112,
              width: 112,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    height: 100,
                    width: 100,
                    child: CircularProgressIndicator(
                      strokeWidth: 4,
                      valueColor: AlwaysStoppedAnimation<Color>(HexColor('19762A')),
                    ),
                  ),
                  AnimatedBuilder(
                    animation: _colorAnimation,
                    builder: (_, __) {
                      return Icon(widget.icon??
                        HugeIcons.strokeRoundedAiBrain01,
                        color: _colorAnimation.value,
                        size: 50,
                      );
                    },
                  ),
                ],
              ),
            ),
            Spaces.smallTopSpace,
            Text(widget.action??'Verifying...', style: Blacks.mediumSemiPoppins),
          ],
        ),
      ),
    );
  }
}
