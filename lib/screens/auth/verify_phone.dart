import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import 'package:sms_autofill/sms_autofill.dart';
import '../../providers/providers.dart';
class VerifyPhone extends StatefulWidget {
  const VerifyPhone({super.key});

  @override
  State<VerifyPhone> createState() => _VerifyPhoneState();
}

class _VerifyPhoneState extends State<VerifyPhone> with WidgetsBindingObserver ,CodeAutoFill{

  static const int _startSeconds=300; // 5 minutes
  late int _remainingSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<AuthProvider>(context,listen: false).getPhone();
      FlutterNativeSplash.remove();
      WidgetsBinding.instance.addObserver(this);
      _remainingSeconds=_startSeconds;
      if(Provider.of<AuthProvider>(context,listen: false).otpSent==true){
        await SmsAutoFill().unregisterListener();
        await SmsAutoFill().listenForCode();

        _startTimer();

        listenForCode();
      }
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
    Provider.of<AuthProvider>(context,listen: false).resetOtpSent();
    SmsAutoFill().unregisterListener();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if(state==AppLifecycleState.resumed){
      // handle resume state?
    }
  }

  final otpController=TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool b, res){
        return;
      },
      child: Scaffold(
        body: SingleChildScrollView(
          child: Container(
            height: size.height,
            width: size.width,
            alignment: Alignment.bottomCenter,
            decoration: BoxDecoration(
              image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('curve1.png')),
              alignment: Alignment.topCenter)
            ),
            child: Padding(
                padding: EdgeInsets.only(
                  top: size.height/8
                ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(Strings.iconImage('inbox.png'),
                    height: size.height/5,
                    width: size.width/2,
                    fit: BoxFit.cover),
                Spaces.smallTopSpace,
                Padding(
                  padding: Paddings.mediumHorizontal,
                  child: Consumer<AuthProvider>(
                      builder: (_,auth,__) {
                        return Text('An OTP has been sent to your phone ${auth.phone} ',
                            style: Blacks.mediumSemiRoboto,
                            textAlign: TextAlign.center);
                      }
                  ),
                ),
                Spaces.mediumTopSpace,
                // OTP INPUT
                Pinput(
                  controller: otpController,
                  focusedPinTheme:OtpDecorations.focusedPinTheme,
                  defaultPinTheme: OtpDecorations.defaultPinTheme,
                  length: 6,
                  onCompleted: (val)async{
                    await Provider.of<AuthProvider>(context,listen: false)
                        .verifyPhone(otpController.text.trim(),context);
                    otpController.clear();
                  },
                ),
                Spaces.mediumTopSpace,
                Consumer<AuthProvider>(
                  builder: (_,auth,__) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // PROMPT OTP RESEND
                      !auth.otpSent || _remainingSeconds== 0? RichText(
                              text: TextSpan(
                                  style:TextStyle(color: Colors.black),
                                  children:[
                                    TextSpan(
                                        text: 'Didn\'t get the code? ',
                                        style: Blacks.regularBoldCodeNext
                                    ),
                                    TextSpan(
                                        style: Greens.regularBoldCodeNext,
                                        text: auth.resendingOTP?'Resending...' :'Resend it',
                                      recognizer: TapGestureRecognizer()..onTap=()async{
                                          _timer?.cancel();
                                          await Provider.of<AuthProvider>(context,listen: false).sendPhoneOTP();
                                          setState(() {
                                            _remainingSeconds=300;
                                          });
                                          _startTimer();
                                          listenForCode();
                                      }
                                    )
                                  ]
                              )): const SizedBox(),
                          auth.otpSent && _remainingSeconds>0? Row(
                            children: [
                              Icon(HugeIcons.strokeRoundedTime01),
                              Spaces.tinySideSpace,
                              Text(_formatTime(_remainingSeconds))
                            ],
                          ): const SizedBox(),
                        ],
                      ),
                    );
                  }
                ),
                Spaces.mediumTopSpace,
                Consumer<AuthProvider>(
                  builder: (_,auth,__) {
                    return auth.loading?
                        RotatingDots():
                    AuthButton(text: 'VERIFY',
                      tapped: ()async{
                    if(otpController.text.trim().length==6){
                      await Provider.of<AuthProvider>(context,listen: false).verifyPhone(otpController.text.trim(),context);
                      otpController.clear();
                    }else{
                      Fluttertoast.showToast(msg: 'Please enter the OTP you received');
                    }
                      });
                  }
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
            )),
          ),
        ),
      ),
    );
  }
}
