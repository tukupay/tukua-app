import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class ForgotPassword extends StatefulWidget {
  const ForgotPassword({super.key});

  @override
  State<ForgotPassword> createState() => _ForgotPasswordState();
}

class _ForgotPasswordState extends State<ForgotPassword> {
  final phoneController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: Consumer<AuthProvider>(
        builder: (_,auth,__) {
          return Container(
            height: size.height,
            width: size.width,
            decoration: BoxDecoration(
              image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('curve1.png')),
              fit: BoxFit.contain,
              alignment: Alignment.topLeft)
            ),
            child: Padding(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).viewPadding.top,
              ),
              child: SizedBox(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Padding(
                      padding: Paddings.tinyAllSides,
                      child: SizedBox(
                        height: 45,
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap:(){
                                Navigator.pop(context);
                              },
                              child: Container(
                                alignment: Alignment.center,
                                height: 40,width: 40,
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle
                                ),
                                child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                                    size: 30),
                              ),
                            ),
                            Spacer()
                          ],
                        ),
                      ),
                    ),
                    Container(
                      height: size.height/2.5,
                      padding: Paddings.tinyAllSides,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Forgot Password?',style: Blacks.largeSemiPoppins),
                          Spaces.smallTopSpace,
                          Text('Don\'t worry! It happens. Please enter your Tuku registered phone number'),
                          Spaces.smallTopSpace,
                          LoanTextField(
                            isNumber: true,
                            controller: phoneController,
                              borderColor: AppColors.lightGray,
                              hint: 'Enter your 10-digit phone number'),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Container(
                        alignment: Alignment.topCenter,
                        decoration: BoxDecoration(
                            image: DecorationImage(
                                image: AssetImage(Strings.imageAsset('curve2.png')),
                                fit: BoxFit.contain,
                                alignment: Alignment.bottomLeft)
                        ),
                        child:
                        auth.requestingReset?
                        const Center(child: WaveDots()):
                        AuthButton(
                            text: 'REQUEST PASSWORD RESET',
                        tapped: ()async{
                              if(phoneController.text.isEmpty||phoneController.text.length!=10){
                                Fluttertoast.showToast(msg: 'Enter a valid phone number');
                              }else{
                                await auth.requestPasswordReset(phoneController.text);
                                if(auth.passResetRequest!=null){
                                  Fluttertoast.showToast(msg: auth.passResetRequest!);
                                  Navigator.pop(context);
                                }
                              }
                        },),
                      ),
                    )
                  ],
                ),
              ),
            ),
          );
        }
      ),
    );
  }
}
