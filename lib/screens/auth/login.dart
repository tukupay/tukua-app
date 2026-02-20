import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/utils/utils.dart';
import 'package:tuku/widgets/widget.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Provider.of<ProfileProvider>(context, listen: false).getUser();
      FlutterNativeSplash.remove();
      // CHECK BIOMETRICS
      await Provider.of<BiometricsProvider>(context,listen: false).checkBiometricsAvailability(context);
    });
    super.initState();
  }

  TextEditingController phoneController = TextEditingController();
  TextEditingController passController = TextEditingController();
  bool obscurePass = true;
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
        body: Container(
      height: size.height,
      width: size.width,
      alignment: Alignment.bottomCenter,
      decoration: BoxDecoration(
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('curve1.png')),
              alignment: Alignment.topCenter)),
      child: Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).viewInsets.top),
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // ### LOGO & PARTNER ###
              LogoPartners(),
              Spaces.smallTopSpace,
              // ### BANK GPT CHIP ###
              BankGptChip(),
              Spaces.smallTopSpace,
              // ### LOGIN FORM COMPONENTS ###
              Text('Login to your account', style: Blacks.regularSemiPoppins),
              Spaces.smallTopSpace,
              SizedBox(
                width: size.width / 1.2,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    AuthTextField(
                      numbers: true,
                      obscureIcon: Icons.phone,
                      hint: '0701234567',
                      changed: (val){
                        setState(() {
                          phoneController.text=val;
                        });
                      },
                      controller: phoneController,
                    ),
                    Spaces.smallTopSpace,
                    AuthTextField(
                      hint: 'Password',
                      controller: passController,
                      goNext: false,
                      isPassword: true,
                      obscureIcon: obscurePass ? Icons.visibility : Icons.visibility_off,
                      obscure: obscurePass,
                      suffixTap: () {
                        setState(() {
                          obscurePass = !obscurePass;
                        });
                      },
                      changed: (val){
                        setState(() {
                          passController.text=val;
                        });
                      },
                    ),
                    Spaces.smallTopSpace,
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.check_circle_outline,
                              color: HexColor('#8B8B8B'),
                            ),
                            Text('Remember Me', style: Grays.tinyPoppinsHint)
                          ],
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.pushNamed(context, Routes.forgotPassword);
                          },
                          child: Text('Forgotten Password?',
                              style: Oranges.tinyPoppins),
                        )
                      ],
                    ),
                    Spaces.smallTopSpace,
                    SizedBox(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Consumer3<AuthProvider,KycIndividualProvider,KycBusinessProvider>(
                                builder: (_, auth,individual,business, __) {
                              return auth.loading == true ||
                                  individual.loadingKycs == true ||
                                  business.loadingKycs==true ? RotatingDots()
                                  : AuthButton(
                                      enabled: (StringUtils.cleanPhoneNumber(phoneController.text).length == 9 ||
                                          StringUtils.cleanPhoneNumber(phoneController.text).length == 10) &&
                                          (passController.text.replaceAll(" ", '').trim().isNotEmpty &&
                                              passController.text.replaceAll(" ", '').trim().length >= 6),
                                      text: 'LOG IN',
                                      tapped: () async {
                                        if (StringUtils.cleanPhoneNumber(phoneController.text).length < 9 ||
                                            StringUtils.cleanPhoneNumber(phoneController.text).length > 10) {
                                          Fluttertoast.showToast(msg: 'Enter your valid phone number');
                                        } else if (passController.text.replaceAll(" ", "").trim().isEmpty) {
                                          Fluttertoast.showToast(msg: 'Enter your password');
                                        } else if(passController.text.replaceAll(" ", "").trim().length < 6){
                                          Fluttertoast.showToast(msg: 'Your password should be at least 6 characters');
                                        } else {
                                          FocusScope.of(context).unfocus();
                                          Provider.of<AuthProvider>(context,listen: false).setPhone(phoneController.text.trim());
                                          await Provider.of<AuthProvider>(context, listen: false)
                                              .login(phoneController.text.trim(), passController.text.trim(), context);
                                        }
                                      },
                                    );
                            }),
                          ),
                          Spaces.smallSideSpace,
                          Consumer2<BiometricsProvider,AuthProvider>(
                              builder: (_,biometrics,auth,__){
                                return biometrics.isBiometricsAvailable == true &&
                                !auth.loading?
                                GestureDetector(
                                  onTap: ()async{
                                   await biometrics.handleBiometricLogin(context);
                                  },
                                  child: Container(
                                    padding: Paddings.smallestAllSides,
                                    decoration: BoxDecoration(
                                        color: HexColor(AppColors.primaryOrange),
                                        shape: BoxShape.circle
                                    ),
                                    child: Icon(HugeIcons.strokeRoundedFingerPrint,
                                        color: Colors.white,size: 32),
                                  ),
                                ):const SizedBox();
                              })
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // ### ALT LOGINS ###
              Spaces.smallTopSpace,
              Container(
                  height: size.height / 5,
                  decoration: BoxDecoration(
                      // color: Colors.purple.withAlpha(100),
                      image: DecorationImage(
                          image: AssetImage(Strings.imageAsset('curve2.png')),
                          alignment: Alignment.centerLeft)),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          YellowOne(),
                          Spaces.smallSideSpace,
                          Text('OR', style: Blacks.regularSemiPoppins),
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Don\'t have an Account?'),
                          Spaces.smallSideSpace,
                          GestureDetector(
                              onTap: () {
                                FocusScope.of(context).unfocus();
                                Navigator.pushNamed(context, Routes.register);
                              },
                              child: Container(
                                padding: Paddings.smallestAllSides,
                                decoration: BoxDecoration(
                                    color: HexColor('#E85D1C'),
                                    borderRadius: BorderRadius.circular(10)),
                                child: Text('Create Account',
                                    style: TextStyle(color: Colors.white)),
                              )),
                        ],
                      ),
                    ],
                  ))
            ],
          ),
        ),
      ),
    ));
  }
}
