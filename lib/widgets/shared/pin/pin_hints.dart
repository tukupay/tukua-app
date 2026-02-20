import 'package:flutter/material.dart';
import 'package:tuku/providers/providers.dart';

/// PinHints shows the validation hints derived from `PinProvider`.
class PinHints extends StatelessWidget {
  final PinProvider pin;
  final TextStyle? style;
  const PinHints({super.key, required this.pin, this.style});

  @override
  Widget build(BuildContext context) {
    final TextStyle s = style ?? Theme.of(context).textTheme.bodySmall ?? const TextStyle(fontSize: 12);

    final hints = <Map<String, dynamic>>[
      {'text': 'Exactly 4 digits', 'ok': pin.lengthOk},
      {'text': 'Not all the same digit', 'ok': pin.notAllSame},
      {'text': 'Not sequential (e.g. 1234 or 4321)', 'ok': pin.notSequential},
      {'text': 'Not a simple repeating pattern', 'ok': pin.notSimpleRepeat},
      {'text': 'Not paired blocks (e.g. 1122)', 'ok': pin.notTwoBlockPattern},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: hints.map((h) {
        final ok = h['ok'] as bool?;
        Widget icon;
        Color textColor = s.color ?? Colors.black;
        if (ok == null) {
          icon = const Icon(Icons.radio_button_unchecked, size: 18, color: Colors.grey);
          textColor = Colors.grey;
        } else if (ok == true) {
          icon = const Icon(Icons.check_circle, size: 18, color: Colors.green);
          textColor = Colors.green;
        } else {
          icon = const Icon(Icons.cancel, size: 18, color: Colors.redAccent);
          textColor = Colors.redAccent;
        }

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4.0),
          child: Row(
            children: [
              icon,
              const SizedBox(width: 10),
              Expanded(child: Text(h['text'] as String, style: s.copyWith(color: textColor))),
            ],
          ),
        );
      }).toList(),
    );
  }
}

