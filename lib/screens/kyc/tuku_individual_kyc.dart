import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import '../../providers/providers.dart';
import '../../widgets/widget.dart';

class TukuIndividualKyc extends StatefulWidget {
  const TukuIndividualKyc({super.key});

  @override
  State<TukuIndividualKyc> createState() => _TukuIndividualKycState();
}

class _TukuIndividualKycState extends State<TukuIndividualKyc> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      // SKIP TO LAST STEP USER WAS IN
      await Provider.of<TukuIndividualKycProvider>(context,listen: false).getCurrentStep();
      // FETCH USER BEARER TOKEN
      await Provider.of<AuthProvider>(context,listen: false).getAccessToken();
      // FETCH LATEST USER
      await Provider.of<AuthProvider>(context,listen: false).updateUser(context);
      await Provider.of<ProfileProvider>(context,listen: false).getUser();
      // FETCH CURRENT USER'S KYCs
      await Provider.of<TukuIndividualKycProvider>(context,listen: false).getUserKycs(context);
      FlutterNativeSplash.remove();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<TukuIndividualKycProvider,AuthProvider>(
        builder: (_, kyc,auth, __) {
      return PopScope(
        // canPop: kycProvider.currentStep == 0,
        canPop: false,
        onPopInvokedWithResult: (bool b, res) {
          return;
        },
        child: Scaffold(
          appBar: AppBar(
            title: Text('Complete Your KYC',
            style: Whites.mediumBoldRoboto),
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
                firstStep: 'ID',
                secondStep: 'Selfie',
                lastStep: 'Email',
                currentStep: kyc.currentStep,
              ),
              Spaces.smallTopSpace,
              // steppers content
              Expanded(
                  child: SingleChildScrollView(
                      child: IndividualKycSteps[kyc.currentStep])),
              Spaces.smallTopSpace,
              Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // SKIP KYC
                          SkipButton(),
                          Spaces.smallSideSpace,
                          Expanded(
                            child: kyc.finishing?const RotatingDots(): AuthButton(
                              enabled: !kyc.submittingFrontId || !kyc.submittingSelfie || !kyc.submittingBackId,
                            text: kyc.currentStep == IndividualKycSteps.length - 1
                                ? 'Submit'
                                : 'Next',
                            tapped: () async {
                              // in selfie page, proceed only when selfie is face
                              if(kyc.userKycs.where((el)=>el.isFace!=null).isNotEmpty && kyc.currentStep==1){
                                // BUILD ANALYSIS ALERT
                                showAdaptiveDialog(
                                    context: context,
                                    barrierDismissible: false,
                                    builder: (context)=>AiAnalysisAlert());
                              }
                              final success = (kyc.currentStep==2 &&
                                  !Strings.emailRegEx.hasMatch(auth.emailController.text.trim()))? false
                                  : await kyc.handleStepSubmission(context);
                              if(kyc.currentStep==2 &&
                                  !Strings.emailRegEx.hasMatch(auth.emailController.text.trim())){
                                Fluttertoast.showToast(msg: 'What\'s your email?');
                              }
                              if (success) {
                                if(kyc.currentStep==1){
                                  // POP AI VERIFYING ALERT
                                  Navigator.pop(context);
                                  // SHOW ID INFO ALERT
                                  showGeneralDialog(
                                      context: context,
                                      pageBuilder: (context,anim1,anim2){
                                        return const SizedBox();
                                      },
                                      transitionDuration: const Duration(milliseconds: 700),
                                      transitionBuilder: (context,anim1,anim2,child){
                                        return InfoAlert(anim1: anim1,isIndividual: true);
                                      }
                                  );
                                }  else{
                                  await kyc.nextStep();
                                }
                              } else {
                                // Fluttertoast.showToast(msg: 'Something is missing');
                              }
                            }),
                          ),
                        ],
                      )),
            ],
          ),
        ),
      );
    });
  }
}
