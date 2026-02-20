import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

class ColorChangingText extends StatefulWidget {
  final String text;

  const ColorChangingText({
    super.key,
    required this.text,
  });

  @override
  State<ColorChangingText> createState() => _ColorChangingTextState();
}

class _ColorChangingTextState extends State<ColorChangingText> {
  int _currentIndex = 0;
  bool _isDisposed = false;

  final List<List<Color>> _gradientColors = [
    [HexColor('#19762A'), HexColor('#F0CE09')],
    [HexColor('#DA7209'), HexColor('#F009D9')],
  ];

  @override
  void initState() {
    super.initState();
    _startColorChange();
  }

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  void _startColorChange() {
    Future.delayed(Duration(seconds: 2), () {
      if (_isDisposed) return;
      setState(() {
        _currentIndex = (_currentIndex + 1) % _gradientColors.length;
      });
      _startColorChange(); // continue loop
    });
  }

  @override
  Widget build(BuildContext context) {
    final gradient = LinearGradient(
      colors: _gradientColors[_currentIndex],
    );

    return AnimatedSwitcher(
      duration: Duration(seconds: 1),
      child: ShaderMask(
        key: ValueKey(_currentIndex), // force animation
        shaderCallback: (bounds) {
          return gradient.createShader(Rect.fromLTWH(0, 0, bounds.width, bounds.height));
        },
        blendMode: BlendMode.srcIn,
        child: Text(
          widget.text,
          style: TextStyle(
            fontSize: 45,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
