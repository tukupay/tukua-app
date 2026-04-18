import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../widgets/widget.dart';

class SasaIndividualKyc extends StatefulWidget {
  const SasaIndividualKyc({super.key});

  @override
  State<SasaIndividualKyc> createState() => _SasaIndividualKycState();
}

class _SasaIndividualKycState extends State<SasaIndividualKyc> {

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      // SKIP TO LAST STEP USER WAS IN
      await Provider.of<SasaIndividualKycProvider>(context,listen: false).getCurrentStep();
      FlutterNativeSplash.remove();
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SasaIndividualKycProvider>(
      builder: (_,kyc,__) {
        return PopScope(
          canPop: kyc.currentStep==0? true:false,
          onPopInvokedWithResult: (bool b, res) {
            kyc.previousStep();
            return;
          },
          child: Scaffold(
            appBar: AppBar(
              title: Text('Complete Your KYC'),
              centerTitle: true,
              automaticallyImplyLeading: false,
              backgroundColor: Colors.transparent,
              flexibleSpace: GradientAppBar(),
            ),
            body: Column(
              children: [
                Spaces.smallTopSpace,
                // steppers indicator
                StepProgressIndicator(
                    firstStep: "Confirm Details",
                    secondStep: "Confirm OTP",
                    lastStep: "Activate Wallet",
                    currentStep: kyc.currentStep),
                Spaces.smallTopSpace,
                // steppers content
                Expanded(
                    child: kyc.sasaIndividualSteps[kyc.currentStep]
                ),
                Spaces.smallTopSpace,
                kyc.currentStep==1?const SizedBox():
                Padding(
                    padding: EdgeInsets.all( 16.0),
                child: AuthButton(
                    text:  kyc.currentStep==kyc.sasaIndividualSteps.length-1?
                    "Activate Wallet":"Next",
                    color: kyc.currentStep==kyc.sasaIndividualSteps.length-1?
                    AppColors.fadedGreen:null,
                    tapped: ()async{
                      await kyc.handleStepSubmission(context);
                    }))
              ],
            ),
          ),
        );
      }
    );
  }
}
