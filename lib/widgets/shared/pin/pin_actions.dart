import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../widget.dart';

/// PinActions composes the NumericPad and Continue button and drives the provider.
class PinActions extends StatelessWidget {
  const PinActions({super.key});

  @override
  Widget build(BuildContext context) {
    final pin = Provider.of<PinProvider>(context);
    final profile = Provider.of<ProfileProvider>(context);
    // Use profile.user.requiresPinSetup for accuracy (same source as TransactionPin)
    final requiresSetup = profile.user?.requiresPinSetup == true;
    final inConfirm = pin.inConfirmStep;

    return Consumer<PaymentsProvider>(
      builder: (_,payments,__) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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

                // Handle setup - creating PIN for the first time
                if (requiresSetup) {
                  if (!pin.inConfirmStep) {
                    pin.startConfirmIfValid();
                    return;
                  }
                  await pin.confirmAndSubmit(context);
                  return; // Exit after setup complete
                }

                // Verify mode - for transactions (only when not in setup)
                final ok = pin.verifyLocal();
                if (ok) {
                    Provider.of<PaymentsProvider>(context,listen: false).setPin(pin.pin);
                    showAdaptiveDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (context)=>AiAnalysisAlert(
                            icon: HugeIcons.strokeRoundedLockPassword,
                            action: 'Processing...'));
                    await payments.directPayment(payments.pendingRequest!,context);
                    Navigator.pop(context); // close "processing" alert
                    Provider.of<PaymentsProvider>(context,listen: false).resetPin();
                    pin.resetEntry();
                    if(payments.paymentResponse?.error==null){
                      // show success dialog
                      showGeneralDialog(
                          context: context,
                          pageBuilder: (context,anim1,anim2){
                            return const SizedBox();
                          },
                          transitionDuration: const Duration(milliseconds: 700),
                          transitionBuilder: (context,anim1,anim2,child){
                            return InfoAlert(
                                anim1: anim1,
                                isSuccess: true,
                                payment: payments.paymentResponse);
                          }
                      );
                      Provider.of<PosProvider>(context,listen: false).getRecentPosTransactions();
                    }else{
                      // show transaction error
                      await showGeneralDialog(
                          context: context,
                          barrierDismissible: false,
                          pageBuilder: (context,anim1,anim2)=>const SizedBox(),
                          transitionDuration: const Duration(milliseconds: 400),
                          transitionBuilder: (context,anim1,anim2,child){
                            return SlideTransition(
                              position: Tween(
                                begin: const Offset(1, 0),
                                end: const Offset(0, 0),
                              ).animate(anim1),
                              child: StatefulBuilder(
                                  builder: (context,stateSetter){
                                    return SuccessAlert(
                                        icon: Icons.warning_sharp,
                                        title: "Transaction Error",
                                        content: payments.paymentResponse!.error!,
                                        buttonText:"Okay",
                                        tapped: (){
                                          Navigator.pop(context);
                                        },
                                        anim1: anim1);
                                  }),);
                          });
                    }
                  }
              },
            ),
          ],
        );
      }
    );
  }
}

