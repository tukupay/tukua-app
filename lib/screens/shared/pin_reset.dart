import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';


/// Standalone PIN reset page - uses PinProvider for state management.
class PinReset extends StatelessWidget {
  const PinReset({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PinProvider>(
      builder: (_, pin, __) {
        final theme = Theme.of(context);
        final dotSize = MediaQuery.of(context).size.width * 0.04 + 12;
        final inConfirm = pin.inResetConfirmStep;
        final title = inConfirm ? 'Confirm New PIN' : 'Create New PIN';

        return Scaffold(
          backgroundColor: theme.scaffoldBackgroundColor,
          appBar: AppBar(
            leading: IconButton(
              onPressed: () {
                pin.clearResetState();
                Navigator.pop(context);
              },
              icon: Icon(Icons.close, color: HexColor(AppColors.red)),
            ),
            title: Text(title, style: Blacks.mediumSemiRubik),
            centerTitle: true,
            elevation: 0,
          ),
          body: SingleChildScrollView(
            child: Container(
              padding: Paddings.tinyAllSides,
              child: Column(
                children: [
                  Text(
                    'Create a new PIN to secure your transactions.',
                    style: theme.textTheme.bodyLarge?.copyWith(color: theme.hintColor),
                    textAlign: TextAlign.center,
                  ),
                  Spaces.mediumTopSpace,
                  // PIN dots
                  PinDots(pin: pin.pin, dotSize: dotSize),
                  Spaces.smallTopSpace,
                  // Error / loading indicator
                  AnimatedSize(
                    duration: const Duration(milliseconds: 200),
                    child: SizedBox(
                      height: 22,
                      child: Center(
                        child: pin.error == null
                            ? (pin.submitting
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const SizedBox.shrink())
                            : Text(
                                pin.error!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.redAccent,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ),
                  // PIN hints
                  const SizedBox(height: 8),
                  PinHints(pin: pin, style: theme.textTheme.bodySmall),
                  Spaces.mediumTopSpace,
                  // Numeric pad
                  NumericPad(
                    onDigit: (d) => pin.appendDigit(d),
                    onBackspace: () => pin.backspace(),
                  ),
                  const SizedBox(height: 18),
                  AltGreenButton(
                    text: inConfirm ? 'Finish' : 'Continue',
                    disabled: pin.submitting || !pin.isCurrentValid,
                    tapped: () async {
                      if (pin.submitting) return;
                      if (!inConfirm) {
                        pin.startResetConfirmIfValid();
                      } else {
                        final ok = await pin.confirmAndResetPin();
                        if (ok) {
                          Fluttertoast.showToast(
                            msg: "PIN reset successfully!",
                            backgroundColor: Colors.green,
                          );
                          if (context.mounted) Navigator.pop(context);
                        }
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
