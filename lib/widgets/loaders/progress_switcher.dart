import 'package:custom_linear_progress_indicator/custom_linear_progress_indicator.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'dart:async';

import 'package:tuku/constants/constants.dart';

class ProgressSwitcher extends StatefulWidget {
  const ProgressSwitcher({super.key});

  @override
  State<ProgressSwitcher> createState() => _ProgressSwitcherState();
}

class _ProgressSwitcherState extends State<ProgressSwitcher> with SingleTickerProviderStateMixin{

  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;
  bool showLinear=true;


  @override
  void initState() {
    super.initState();
    // after 3 secs, switch to circular indicator
    Timer(Duration(seconds: 3), (){
      if(mounted){
        setState(() {
          showLinear=false;
        });
      }
    });
    _controller=AnimationController(
        vsync: this,
        duration: const Duration(seconds: 3))..repeat(reverse: true);

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
    return Container(
      padding: Paddings.smallAllSides,
      alignment: Alignment.center,
      child: showLinear ?
      Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Uploading...'),
          Spaces.smallTopSpace,
          CustomLinearProgressIndicator(
            maxValue: 1, // new
            value: 1,
            minHeight: 12,
            borderWidth: 0,
            borderStyle: BorderStyle.solid,
            colorLinearProgress: Colors.black,
            animationDuration: 3000,
            borderRadius: 28,
            linearProgressBarBorderRadius: 28,
            backgroundColor: Colors.green.shade50,
            progressAnimationCurve: Curves.bounceInOut, // new
            alignment: Alignment.center, // new
            showPercent: false,// new
            percentTextStyle: const TextStyle(fontWeight: FontWeight.bold),
            gradientColors: [HexColor('#19762A'), HexColor('#F0CE09')], // new
            onProgressChanged: (double value) {
              // new
            },
          ),
        ],
      ): Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Spinner + Animated Icon
          SizedBox(
            height: 70,
            width: 70,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  height: 60,
                  width: 60,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(HexColor('19762A')),
                  ),
                ),
                AnimatedBuilder(
                  animation: _colorAnimation,
                  builder: (_, __) {
                    return Icon(
                      HugeIcons.strokeRoundedAiBrain01,
                      color: _colorAnimation.value,
                      size: 32,
                    );
                  },
                ),
              ],
            ),
          ),
          Spaces.smallTopSpace,
          Text('Processing...')
        ],
      ),
    );
  }
}
