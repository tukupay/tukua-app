import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:sms_autofill/sms_autofill.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';
class TransactionOtp extends StatefulWidget {
  const TransactionOtp({super.key});

  @override
  State<TransactionOtp> createState() => _TransactionOtpState();
}

class _TransactionOtpState extends State<TransactionOtp> with WidgetsBindingObserver, CodeAutoFill{

  int _remainingSeconds=300;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      WidgetsBinding.instance.addObserver(this);
      await SmsAutoFill().unregisterListener();
      await SmsAutoFill().listenForCode();

      _startTimer();

      listenForCode();
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_remainingSeconds == 0) {
        timer.cancel();
        // Optional: trigger timeout action here
      } else {
        setState(() {
          _remainingSeconds--;
        });
      }
    });
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  void codeUpdated() {
    if(code!=null && code!.length==6){
      otpController.setText(code!);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    SmsAutoFill().unregisterListener();
    super.dispose();
  }

  final otpController=TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: SingleChildScrollView(
        child: Consumer4<ProfileProvider,PaymentsProvider,PinProvider,AuthProvider>(
          builder: (_,profile,payments,pin,auth,__) {
            return Container(
              height: size.height,
              width: size.width,
              alignment: Alignment.bottomCenter,
              decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('curve1.png')),
                alignment: Alignment.topCenter),
              ),
              child: Padding(
                  padding: EdgeInsets.only(
                    top: size.height/8
                  ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // pic
                  Image.asset(Strings.iconImage('transaction.png'),
                  height: size.height/4,
                  width: size.width/1.5,
                  fit: BoxFit.cover),
                  Spaces.smallTopSpace,
                  SizedBox(
                    width: size.width/1.2,
                    child: Text("We have sent you an otp to ${hideMiddleCharacters(convertToLocalKenyanFormat(profile.user?.phoneNumber)??'0')}",
                    style: Blacks.mediumSemiPoppins,
                    textAlign: TextAlign.center),
                  ),
                  Spaces.smallTopSpace,
                  Text('Confirm This Transaction...',style: Blacks.regularThinPoppins),
                  Spaces.smallTopSpace,
                  // OTP INPUT
                  Pinput(
                    controller: otpController,
                    focusedPinTheme: PinTheme(
                        height: 56,width: 50,
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: HexColor('#007B5D')
                            )
                        )
                    ),
                    defaultPinTheme: PinTheme(
                        height: 56,width: 50,
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: HexColor('#E7EAEB')
                            )
                        )
                    ),
                    length: 6,
                    onCompleted: (val)async{
                      if(pin.isResetting){
                        // Show loading indicator
                        Fluttertoast.showToast(
                          msg: "Verifying OTP...",
                          toastLength: Toast.LENGTH_SHORT);

                        await Provider.of<AuthProvider>(context,listen: false).verifyPhone(val, context);
                        Fluttertoast.cancel();

                        if(auth.authError==null){
                          // OTP verified successfully, navigate to PIN reset page
                          Fluttertoast.showToast(
                            msg: "Verified! Create your new PIN.",
                            toastLength: Toast.LENGTH_SHORT,
                            backgroundColor: Colors.green,
                          );

                          // Navigate to standalone PIN reset page
                          Navigator.pushReplacementNamed(context, Routes.pinReset);
                        } else {
                          // Show error message
                          Fluttertoast.showToast(
                            msg: auth.authError ?? "Invalid OTP. Please try again.",
                            toastLength: Toast.LENGTH_LONG,
                            backgroundColor: Colors.redAccent,
                          );
                          // Clear the OTP field to let user try again
                          otpController.clear();
                        }
                      }else{
                        payments.setOtp(otpController.text);
                        showAdaptiveDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (context)=>AiAnalysisAlert(
                                icon: HugeIcons.strokeRoundedLockPassword,
                                action: 'Processing...'));
                        await payments.directPayment(payments.pendingRequest!,context);
                        Navigator.pop(context); // close "processing" alert
                        payments.resetOtp();
                        otpController.clear();
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
                                              val='';
                                              Navigator.pop(context);
                                            },
                                            anim1: anim1);
                                      }),);
                              });
                        }
                      }
                    },
                  ),
                  Spaces.mediumTopSpace,
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // PROMPT OTP RESEND
                        RichText(
                            text: TextSpan(
                                style:TextStyle(color: Colors.black),
                                children:[
                                  TextSpan(
                                      text: 'Didn\'t get the code? ',
                                      style: Blacks.regularBoldCodeNext
                                  ),
                                  TextSpan(
                                      style: Greens.regularBoldCodeNext,
                                      text:'Resend it',
                                      recognizer: TapGestureRecognizer()..onTap=()async{
                                        Fluttertoast.cancel();
                                        Fluttertoast.showToast(msg: 'Resend OTP');
                                      }
                                  )
                                ]
                            )),
                        // TIMER COUNTDOWN
                        _remainingSeconds>0?
                        Row(
                          children: [
                            Icon(HugeIcons.strokeRoundedTime01),
                            Spaces.tinySideSpace,
                            Text(_formatTime(_remainingSeconds))
                          ],
                        ):const SizedBox()
                      ],
                    ),
                  ),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                          image: DecorationImage(
                              image: AssetImage(Strings.imageAsset('curve2.png')),
                              alignment: Alignment.centerLeft)
                      ),
                    ),
                  )
                ],
              ),
              ),
            );
          }
        ),
      ),
    );
  }
}
