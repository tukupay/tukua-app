import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';

class AnimatedFAB extends StatefulWidget {
  final VoidCallback onPressed;

  const AnimatedFAB({super.key, required this.onPressed});

  @override
  _AnimatedFABState createState() => _AnimatedFABState();
}

class _AnimatedFABState extends State<AnimatedFAB> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<Color?> _colorAnimation;
  late Animation<double> _sizeAnimation;
  late Animation<Color?> _iconColorAnimation;

  Color _currentBegin = HexColor(AppColors.primaryGreen); // currently applied begin color
  Color _currentEnd = HexColor("#006D69"); // currently applied end color

  Color _hexToColor(String hex, [Color fallback = const Color(0xFF15411D)]) {
    final s = hex.trim();
    final withHash = s.startsWith('#') ? s : '#$s';
    try {
      return HexColor(withHash);
    } catch (_) {
      return fallback;
    }
  }

  
  void _updateColorAnimation(Color begin, Color end) {
    _colorAnimation = ColorTween(begin: begin, end: end).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 3000), // Shorter duration for sharp pulse
    )..repeat(reverse: true); // Reverse to make it pulse back and forth

    _sizeAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // resolve initial colors from widget props (strings expected)
    _currentBegin = _hexToColor(AppColors.primaryGreen, HexColor(AppColors.primaryGreen));
    _currentEnd = _hexToColor('#236c30', HexColor('#236c30'));

    _updateColorAnimation(_currentBegin, _currentEnd);

    _iconColorAnimation = TweenSequence<Color?>(
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
    ).animate(_pulseController);
  }

  @override
  void didUpdateWidget(covariant AnimatedFAB oldWidget) {
    super.didUpdateWidget(oldWidget);

    final newBegin = _hexToColor(AppColors.primaryGreen, _currentBegin);
    final newEnd = _hexToColor('#236c30', _currentEnd);

    if (newBegin != _currentBegin || newEnd != _currentEnd) {
      _currentBegin = newBegin;
      _currentEnd = newEnd;
      _updateColorAnimation(_currentBegin, _currentEnd);
      // trigger rebuild so AnimatedBuilder reads the updated tween
      setState(() {});
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Transform.scale(
          scale: _sizeAnimation.value, // Sharp pulse scaling effect
          child: Material(
            color: _colorAnimation.value, // Smooth green color transition
            shape: CircleBorder(),
            child: child,
          ),
        );
      },
      child: FloatingActionButton(
        backgroundColor: Colors.transparent,
        onPressed: widget.onPressed,
        child: AnimatedBuilder(
          animation: _iconColorAnimation,
          builder: (_,__) {
            return HugeIcon(
              size: 34,
              icon: HugeIcons.strokeRoundedAiBrain01,
              color: _iconColorAnimation.value ?? Colors.white,
            );
          }
        ),
      ),
    );
  }
}
