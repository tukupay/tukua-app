import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// NumericPad - small iOS-like numeric keypad used for PIN entry.
///
/// Improvements added:
/// - BackdropFilter blur around the pad for subtle depth.
/// - Per-key pressed animation (scale) using a private _KeyButton widget.
/// - Tuned alpha values (use withAlpha to avoid withOpacity deprecation).
/// - All keys are equal-width so the bottom row (placeholder/0/backspace) aligns.
class NumericPad extends StatelessWidget {
  final void Function(String) onDigit;
  final VoidCallback onBackspace;

  const NumericPad({
    super.key,
    required this.onDigit,
    required this.onBackspace,});

  // Tweak these to adjust the visual "iOS feel".
  static const int _surfaceAlpha = 20; // subtle fill for keys
  static const int _borderAlpha = 30; // subtle border
  static const int _shadowAlpha = 12; // soft shadow

  /// Create a text key. This delegates the press animation to _KeyButton.
  Widget _textKey(BuildContext context, String label, {VoidCallback? onTap, bool primary = false}) {
    return _KeyButton(
      childBuilder: (isPressed) => Text(
        label,
        style: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: primary ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurface,
        ),
      ),
      onTapDown: () => HapticFeedback.selectionClick(),
      onTapUp: onTap,
      // pass decoration parameters so the _KeyButton can build the same visual style
      backgroundColor: primary ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.surface.withAlpha(_surfaceAlpha),
      borderColor: Theme.of(context).dividerColor.withAlpha(_borderAlpha),
      shadowColor: Colors.black.withAlpha(_shadowAlpha),
    );
  }

  /// Create an icon key (backspace). Uses same visual style as text keys.
  Widget _iconKey(BuildContext context, Widget icon, {VoidCallback? onTap}) {
    return _KeyButton(
      childBuilder: (isPressed) => icon,
      onTapDown: () => HapticFeedback.lightImpact(),
      onTapUp: onTap,
      backgroundColor: Theme.of(context).colorScheme.surface.withAlpha(_surfaceAlpha),
      borderColor: Theme.of(context).dividerColor.withAlpha(_borderAlpha),
      shadowColor: Colors.black.withAlpha(_shadowAlpha),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    // Wrap the whole pad in a ClipRRect + BackdropFilter to produce a gentle blur
    // that gives depth (like iOS). The Container itself is transparent so the blur
    // affects the background content behind the pad.
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
        child: Container(
          // transparent container: we only want the blur effect on the backdrop
          color: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // keypad rows
              ...[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
              ].map((row) {
                return Row(
                  children: row.map((d) {
                    return _textKey(
                      context,
                      d,
                      onTap: () => onDigit(d),
                    );
                  }).toList(),
                );
              }),

              // bottom row: placeholder | 0 | backspace (three equal cells)
              Row(
                children: [
                  // left placeholder
                  const Expanded(child: SizedBox()),

                  _textKey(
                    context,
                    '0',
                    onTap: () => onDigit('0'),
                  ),

                  _iconKey(
                    context,
                    Icon(Icons.backspace_outlined, color: colors.onSurface),
                    onTap: () => onBackspace(),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Private stateful key widget that provides a small scale animation on press
/// and consistent visual styling for both text and icon keys.
class _KeyButton extends StatefulWidget {
  final Widget Function(bool isPressed) childBuilder;
  final VoidCallback? onTapUp;
  final VoidCallback? onTapDown;
  final Color backgroundColor;
  final Color borderColor;
  final Color shadowColor;

  const _KeyButton({
    required this.childBuilder,
    this.onTapUp,
    this.onTapDown,
    required this.backgroundColor,
    required this.borderColor,
    required this.shadowColor,
  });

  @override
  State<_KeyButton> createState() => _KeyButtonState();
}

class _KeyButtonState extends State<_KeyButton> with SingleTickerProviderStateMixin {
  // scale used for pressed animation
  double _scale = 1.0;
  static const double _pressedScale = 0.94;
  static const Duration _animationDuration = Duration(milliseconds: 120);

  void _handleTapDown(TapDownDetails details) {
    widget.onTapDown?.call();
    setState(() => _scale = _pressedScale);
  }

  void _handleTapUp(TapUpDetails details) {
    // restore scale then invoke action
    setState(() => _scale = 1.0);
    // small delay to allow the scale animation to be seen
    Future.delayed(const Duration(milliseconds: 60), () => widget.onTapUp?.call());
  }

  void _handleTapCancel() {
    setState(() => _scale = 1.0);
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(6.0),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: _handleTapDown,
          onTapUp: _handleTapUp,
          onTapCancel: _handleTapCancel,
          child: AnimatedScale(
            scale: _scale,
            duration: _animationDuration,
            curve: Curves.easeOutCubic,
            child: Container(
              height: 66,
              decoration: BoxDecoration(
                color: widget.backgroundColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: widget.borderColor),
                boxShadow: [
                  BoxShadow(
                    color: widget.shadowColor,
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Center(child: widget.childBuilder(_scale != 1.0)),
            ),
          ),
        ),
      ),
    );
  }
}