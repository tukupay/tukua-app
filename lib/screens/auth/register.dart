import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';

import '../../constants/constants.dart';
import '../../routes.dart';
import '../../utils/utils.dart';
import '../../widgets/widget.dart';
class Register extends StatefulWidget {
  const Register({super.key});

  @override
  State<Register> createState() => _RegisterState();
}

class _RegisterState extends State<Register> {
  TextEditingController emailController=TextEditingController();
  TextEditingController phoneController=TextEditingController();
  TextEditingController usernameController=TextEditingController();
  TextEditingController passController=TextEditingController();
  TextEditingController titleController=TextEditingController();

  bool obscurePass=true;
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
        body: Container(
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
                top: 35
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ### LOGO PARTNER ###
                  LogoPartners(),
                  Text('Register',style: Blacks.mediumSemiPoppins),
                  Spaces.smallTopSpace,
                  RegType(),
                  Spaces.tinyTopSpace,
                  // ### LOGIN FORM COMPONENTS ###
                  SizedBox(
                    width: size.width/1.2,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AuthTextField(
                          obscureIcon: Icons.phone,
                            hint: '0701234567',
                            numbers: true,
                            changed: (val){
                              setState(() {
                                phoneController.text=val;
                              });
                        },
                        controller: phoneController),
                        Spaces.smallTopSpace,
                        AuthTextField(
                          hint: 'Password',
                          controller: passController,
                          isPassword: true,
                          goNext: false,
                          obscure: obscurePass,
                        obscureIcon:  obscurePass? Icons.visibility:Icons.visibility_off,
                        suffixTap: (){
                          setState(() {
                            obscurePass=!obscurePass;
                          });
                        },
                        changed: (val){
                          setState(() {
                            passController.text=val;
                          });
                        },
                        ),
                        Spaces.smallTopSpace,
                        RichText(
                          textAlign: TextAlign.center,
                            text: TextSpan(
                                style: TextStyle(color: Colors.black),
                                children: [
                                  TextSpan(
                                    style: Blacks.smallestBoldPoppins,
                                    text: 'By verifying your phone number, you agree to our ',
                                  ),
                                  TextSpan(
                                      text: 'Terms & Conditions ',
                                      style: TextStyle(
                                        color: HexColor('#F79515'),
                                          decoration: TextDecoration.underline
                                      ),
                                      recognizer: TapGestureRecognizer()..onTap=(){
                                        Provider.of<WebviewProvider>(context,listen: false).setTitle('Terms and Conditions');
                                        Provider.of<WebviewProvider>(context,listen: false).setLink(Strings.termsLink);
                                        Navigator.pushNamed(context, Routes.bankGPT);
                                      }
                                  ),
                                  TextSpan(
                                    text: 'and ',
                                    style: Blacks.smallestBoldPoppins
                                  ),
                                  TextSpan(
                                      text: 'Privacy Policy',
                                      style: TextStyle(
                                        color: HexColor('#F79515'),
                                          decoration: TextDecoration.underline
                                      ),
                                      recognizer: TapGestureRecognizer()..onTap=(){
                                        Provider.of<WebviewProvider>(context,listen: false).setTitle('Privacy Policy');
                                        Provider.of<WebviewProvider>(context,listen: false).setLink(Strings.privacyLink);
                                        Navigator.pushNamed(context, Routes.bankGPT);
                                      }
                                  )
                                ]
                            )),
                        Spaces.smallTopSpace,
                        Consumer<AuthProvider>(
                          builder: (_,auth,__) {
                            return auth.loading?RotatingDots():
                              AuthButton(
                              enabled: (StringUtils.cleanPhoneNumber(phoneController.text).length==9
                                  ||StringUtils.cleanPhoneNumber(phoneController.text).length==10)&&
                              passController.text.replaceAll(' ', '').trim().length>6,
                              text: 'VERIFY PHONE',
                              tapped: ()async{
                                if(StringUtils.cleanPhoneNumber(phoneController.text).length<9
                                    ||StringUtils.cleanPhoneNumber(phoneController.text).length>10){
                                  Fluttertoast.showToast(msg: 'Enter your phone number');
                                }else if(passController.text.replaceAll(' ', '').length<6){
                                  Fluttertoast.showToast(msg: 'Use a longer password');
                                }else{
                                  Provider.of<AuthProvider>(context,listen: false).setPhone(phoneController.text.trim());
                                  await Provider.of<AuthProvider>(context,listen: false)
                                      .register(passController.text.trim(),context);
                                }
                              },
                            );
                          }
                        ),
                      ],
                    ),
                  ),
                  // ### ALT LOGINS ###
                  Spaces.smallTopSpace,
                  Container(
                      height: size.height/5,
                      decoration: BoxDecoration(
                          image: DecorationImage(
                              image: AssetImage(Strings.imageAsset('curve2.png')),
                              alignment: Alignment.centerLeft)
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              YellowOne(),
                              Spaces.smallSideSpace,
                              Text('OR',style: Blacks.regularSemiPoppins),
                              Spaces.smallSideSpace,
                              YellowTwo()
                            ],
                          ),
                          Spaces.smallTopSpace,
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(HugeIcons.strokeRoundedGoogle),
                              Spaces.smallSideSpace,
                              Icon(HugeIcons.strokeRoundedFacebook02),
                              Spaces.smallSideSpace,
                              Icon(HugeIcons.strokeRoundedApple)
                            ],
                          ),
                          Spaces.smallTopSpace,
                          RichText(
                              text: TextSpan(
                                  style: TextStyle(color: Colors.black),
                                  children: [
                                    TextSpan(
                                      text: 'Already have an Account?  ',
                                      style: Blacks.smallestBoldPoppins
                                    ),
                                    TextSpan(
                                        text: 'Log In',
                                        style: Oranges.tinyPoppins,
                                        recognizer: TapGestureRecognizer()..onTap=()=>
                                            Navigator.pop(context)
                                    )
                                  ]
                              ))
                        ],
                      ))
                ],
              ),
            ),
          ),
        )
    );
  }
}
