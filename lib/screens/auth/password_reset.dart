import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
import '../../routes.dart';
import '../../widgets/widget.dart';
class PasswordReset extends StatefulWidget {
  const PasswordReset({super.key});

  @override
  State<PasswordReset> createState() => _PasswordResetState();
}

class _PasswordResetState extends State<PasswordReset> {
  TextEditingController passController=TextEditingController();
  TextEditingController rePassController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: Container(
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
          child: SingleChildScrollView(
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
                    height: size.height/1.8,
                    padding: Paddings.tinyAllSides,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Create new password',
                            style: Blacks.largeSemiPoppins),
                        Spaces.mediumTopSpace,
                        Text('Choose a password'),
                        Spaces.smallTopSpace,
                        AuthTextField(
                            hint: 'Your New Password',
                            controller: passController),
                        Spaces.smallTopSpace,
                        RichText(
                            text: TextSpan(
                              style: TextStyle(color: Colors.black),
                              children: [
                                TextSpan(
                                  text: 'At least ',
                                ),
                                TextSpan(
                                  text: '8 characters, ',
                                  style: TextStyle(fontWeight: FontWeight.bold)
                                ),
                                TextSpan(
                                  text: 'containing ',
                                ),
                                TextSpan(
                                  text: 'a letter ',
                                  style: TextStyle(fontWeight: FontWeight.bold)
                                ),
                                TextSpan(
                                    text: 'and ',
                                ),
                                TextSpan(
                                  text: 'a number ',
                                    style: TextStyle(fontWeight: FontWeight.bold)
                                ),
                              ]
                            )),
                        Spaces.mediumTopSpace,
                        Text('Confirm password',
                          style: Blacks.largeSemiPoppins),
                        Text('Please confirm your password to continue'),
                        Spaces.smallTopSpace,
                        AuthTextField(
                            hint: 'Your New Password',
                            controller: rePassController),
                        Spaces.smallTopSpace,
                        RichText(
                            text: TextSpan(
                                style: TextStyle(color: Colors.black),
                                children: [
                                  TextSpan(
                                      text: 'At least '
                                  ),
                                  TextSpan(
                                      text: '8 characters, ',
                                      style: TextStyle(fontWeight: FontWeight.bold)
                                  ),
                                  TextSpan(
                                    text: 'containing ',
                                  ),
                                  TextSpan(
                                      text: 'a letter ',
                                      style: TextStyle(fontWeight: FontWeight.bold)
                                  ),
                                  TextSpan(
                                      text: 'and ',
                                  ),
                                  TextSpan(
                                    text: 'a number ',
                                    style: TextStyle(fontWeight: FontWeight.bold)
                                  ),
                                ]
                            )),
                        Spaces.mediumTopSpace,
                      ],
                    ),
                  ),
                  Container(
                    height: size.height/3,
                    alignment: Alignment.topCenter,
                    decoration: BoxDecoration(
                        image: DecorationImage(
                            image: AssetImage(Strings.imageAsset('curve2.png')),
                            fit: BoxFit.contain,
                            alignment: Alignment.bottomLeft)
                    ),
                    child: AuthButton(
                      text: 'RESET PASSWORD',
                      tapped: (){
                        Navigator.pushNamed(context, Routes.home);
                      },),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
