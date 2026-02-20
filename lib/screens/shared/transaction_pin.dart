import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';

class TransactionPin extends StatelessWidget {
  const TransactionPin({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<ProfileProvider, PinProvider>(
      builder: (_, profile, pin, __) {
        final theme = Theme.of(context);
        // Get requiresSetup directly from user model for accuracy
        final requiresSetup = profile.user?.requiresPinSetup == true;
        final inConfirm = pin.inConfirmStep;
        final title = requiresSetup
            ? (inConfirm ? 'Confirm New PIN' : 'Create a PIN')
            : 'Enter your PIN';

        final dotSize = MediaQuery.of(context).size.width * 0.04 + 12;

        return Scaffold(
          backgroundColor: theme.scaffoldBackgroundColor,
          appBar: AppBar(
            leading: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: Icon(Icons.close, color: HexColor(AppColors.red))),
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
                    requiresSetup
                        ? 'Secure your transactions with a strong PIN.'
                        : 'Enter your transaction PIN.',
                    style: theme.textTheme.bodyLarge?.copyWith(color: theme.hintColor),
                    textAlign: TextAlign.center,
                  ),
                  Spaces.mediumTopSpace,
                  // PIN dots (visual)
                  PinDots(pin: pin.pin, dotSize: dotSize),
                  Spaces.smallTopSpace,
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

                  // Show hints when setting up PIN (both initial and confirm)
                  if (requiresSetup) ...[
                    const SizedBox(height: 8),
                    if (inConfirm)
                      Text(
                        'Re-enter your PIN to confirm',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.hintColor,
                          fontStyle: FontStyle.italic,
                        ),
                      )
                    else
                      PinHints(pin: pin, style: theme.textTheme.bodySmall),
                  ],

                  // Show "Forgot PIN?" only in verify mode
                  if (!requiresSetup) ...[
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          Fluttertoast.cancel();
                          if (profile.user?.requiresPinSetup == true) {
                            // User hasn't set up PIN yet - do nothing
                          } else {
                            final navigator = Navigator.of(context);
                            final authProvider = Provider.of<AuthProvider>(context, listen: false);
                            final pinProvider = Provider.of<PinProvider>(context, listen: false);

                            // Show confirmation alert for PIN reset
                            showDialog(
                              context: context,
                              builder: (dialogContext) => ConfirmAlert(
                                text: 'An OTP will be sent to your phone to verify your identity.',
                                pressed: () async {
                                  Navigator.pop(dialogContext);

                                  Fluttertoast.showToast(
                                    msg: "Sending OTP...",
                                    toastLength: Toast.LENGTH_LONG,
                                  );

                                  await authProvider.sendPhoneOTP();
                                  Fluttertoast.cancel();

                                  if (authProvider.authError == null) {
                                    Fluttertoast.showToast(
                                      msg: "OTP sent successfully!",
                                      toastLength: Toast.LENGTH_SHORT,
                                      backgroundColor: Colors.green,
                                    );
                                    // Set resetting state in provider before navigating
                                    pinProvider.setIsResetting(true);
                                    navigator.pushNamed(Routes.transactionOtp);
                                  } else {
                                    Fluttertoast.showToast(
                                      msg: authProvider.authError ?? "Failed to send OTP. Please try again.",
                                      toastLength: Toast.LENGTH_LONG,
                                      backgroundColor: Colors.redAccent,
                                    );
                                  }
                                },
                              ),
                            );
                          }
                        },
                        child: Text(
                          'Forgot PIN?',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: profile.user?.requiresPinSetup == true
                                ? theme.disabledColor
                                : theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                  Spaces.mediumTopSpace,
                  const PinActions(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
