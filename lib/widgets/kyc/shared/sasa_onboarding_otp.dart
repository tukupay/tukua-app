import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';

import '../../../constants/constants.dart';
class SasaOnboardingOtp extends StatefulWidget {
  const SasaOnboardingOtp({super.key});

  @override
  State<SasaOnboardingOtp> createState() => _SasaOnboardingOtpState();
}

class _SasaOnboardingOtpState extends State<SasaOnboardingOtp> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<AppState>(context,listen: false).getAccountType();
    });
  }

  final otpController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.sizeOf(context);
    return SingleChildScrollView(
      child: Consumer3<AppState,SasaIndividualKycProvider,SasaBusinessKycProvider>(
        builder: (_, appState, kycIndividual,kycBusiness, __) {
          return Container(
            width: size.width,
            alignment: Alignment.bottomCenter,
            child: Padding(
                padding: EdgeInsets.only(
                  top: size.height/12
                ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(Strings.iconImage('inbox.png'),
                      height: size.height/6,
                      width: size.width/4,
                      fit: BoxFit.cover),
                  Spaces.smallTopSpace,
                  Padding(
                      padding: Paddings.mediumHorizontal,
                  child: Text("An OTP has been sent to your phone number, please enter it below to confirm your details",
                  style: Blacks.smallestBolderPoppins,
                  textAlign: TextAlign.center),
                  ),
                  Spaces.mediumTopSpace,
                  // OTP INPUT
                  Pinput(
                    controller: otpController,
                    length: 6,
                    focusedPinTheme: OtpDecorations.focusedPinTheme,
                    defaultPinTheme: OtpDecorations.defaultPinTheme,
                    onCompleted: (val)async{
                      Fluttertoast.cancel();
                      if(appState.accountType==Strings.individualAcc){
                        Fluttertoast.showToast(msg: "proceed as individual");
                        kycIndividual.handleStepSubmission(context);
                      }else if(appState.accountType==Strings.businessAcc){
                        Fluttertoast.showToast(msg: "proceed as biz");
                        kycBusiness.handleStepSubmission(context);
                      }else{
                        Fluttertoast.showToast(msg: "Error getting account type");
                      }
                    },
                  ),
                  Spaces.mediumSideSpace,
                ],
              ),
            ),
          );
        }
      ),
    );
  }
}
