import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/kyc/kyc.dart';
import 'package:tuku/widgets/widget.dart';
class SasaBusinessKyc extends StatefulWidget {
  const SasaBusinessKyc({super.key});

  @override
  State<SasaBusinessKyc> createState() => _SasaBusinessKycState();
}

class _SasaBusinessKycState extends State<SasaBusinessKyc> {
  @override
  Widget build(BuildContext context) {
    return Consumer<SasaBusinessKycProvider>(
      builder: (_,kyc,__) {
        return PopScope(
          canPop: kyc.currentStep==0? true:false,
          onPopInvokedWithResult: (bool b,res){
            kyc.previousStep();
            return;
          },
          child: Scaffold(
            appBar: AppBar(
              title: Text("Complete Your KYC"),
              centerTitle: true,
              automaticallyImplyLeading: false,
              backgroundColor: Colors.transparent,
              flexibleSpace: GradientAppBar()
            ),
            body: Column(
              children: [
                Spaces.smallTopSpace,
                // steppers indicator
                StepProgressIndicator(
                    firstStep: "Registration",
                    secondStep: "Confirm OTP",
                    lastStep: "Documents",
                    currentStep: kyc.currentStep),
                Spaces.smallTopSpace,
                // steppers content
                Expanded(
                    child: kyc.sasaBusinessSteps[kyc.currentStep]),
                Spaces.smallTopSpace,
                kyc.currentStep==1?const SizedBox():
                Padding(
                  padding: EdgeInsets.all(16.0),
                  child: AuthButton(
                      text: kyc.currentStep==kyc.sasaBusinessSteps.length-1?
                      "Activate Wallet":"Next",
                      color: kyc.currentStep==kyc.sasaBusinessSteps.length-1?
                      AppColors.fadedGreen:null,
                      tapped: ()async{
                        await kyc.handleStepSubmission(context);
                      }),
                )
              ],
            ),
          ),
        );
      }
    );
  }
}
