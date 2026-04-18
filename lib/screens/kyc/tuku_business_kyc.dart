import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class TukuBusinessKyc extends StatefulWidget {
  const TukuBusinessKyc({super.key});

  @override
  State<TukuBusinessKyc> createState() => _TukuBusinessKycState();
}

class _TukuBusinessKycState extends State<TukuBusinessKyc> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      // SKIP TO LAST STEP USER WAS IN
      await Provider.of<TukuBusinessKycProvider>(context,listen: false).getCurrentStep();
      // FETCH USER BEARER TOKEN
      await Provider.of<AuthProvider>(context,listen: false).getAccessToken();
      // FETCH LATEST USER
      await Provider.of<AuthProvider>(context,listen: false).updateUser(context);
      await Provider.of<ProfileProvider>(context,listen: false).getUser();
      // FETCH CURRENT USER'S KYCs
      await Provider.of<TukuBusinessKycProvider>(context,listen: false).getUserKycs(context);
      FlutterNativeSplash.remove();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<TukuBusinessKycProvider>(
      builder: (_,kyc,__) {
        return PopScope(
          canPop: false,
            onPopInvokedWithResult: (bool b,res){
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
                    firstStep: 'Certificates',
                    secondStep: 'Logo',
                    lastStep: 'Email',
                    currentStep: kyc.currentStep,
                  ),
                  Spaces.smallTopSpace,
                  // steppers content
                  Expanded(
                      child: SingleChildScrollView(
                        child: BusinessKycSteps[kyc.currentStep])),
                  Spaces.smallTopSpace,
                  Padding(
                      padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // SKIP KYC
                      SkipButton(),
                      Spaces.smallSideSpace,
                      Expanded(
                          child: kyc.currentStep==1&&
                              (kyc.submittingBusinessCert||kyc.submittingKraPin||kyc.submittingLogo) ? RotatingDots():
                              kyc.finishing?RotatingDots():
                          AuthButton(
                              text: kyc.currentStep==BusinessKycSteps.length-1?'Submit':'Next',
                              tapped: ()async{
                                final success=await kyc.handleStepSubmission(context);
                                if(success){
                                  await kyc.nextStep();
                                }
                              }))
                    ],
                  ),
                  )
                ],
              ),
            ));
      }
    );
  }
}
