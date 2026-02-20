import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';
import '../widget.dart';
class NewAccountForm extends StatelessWidget {
  final String title;
  final bool isNew;
  const NewAccountForm({super.key,
  required this.title,
  this.isNew=true});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 610,width: size.width,
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: Paddings.tinyAllSides,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: (){
                    Navigator.pop(context);
                  },
                  child: Icon(Icons.arrow_back_ios,color: Colors.black),
                ),
                Text(title,style: Blacks.mediumSemiPoppins),
                const SizedBox()
              ],
            ),
          ),
          Green(),
          Spaces.tinyTopSpace,
          Padding(
              padding: Paddings.tinyAllSides,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Your Card Information is stored in your device. We don\'t store card information for your security',
                  style: Blacks.regularThinPoppins,
                  textAlign: TextAlign.center),
              Spaces.smallTopSpace,
              Text('Card Number'),
              AuthTextField(hint: 'Enter your card number'),
              Spaces.smallTopSpace,
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    width: size.width/2.2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Expiry Date'),
                        AuthTextField(hint: 'MM/YY')
                      ],
                    ),
                  ),
                  SizedBox(
                    width: size.width/2.2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('CVV'),
                        AuthTextField(hint: '')
                      ],
                    ),
                  ),
                ],
              ),
              Spaces.smallTopSpace,
              Text('Country'),
              AuthTextField(hint: 'Kenya'),
              Spaces.smallTopSpace,
              Text('Nickname (Optional)'),
              AuthTextField(hint: 'eg joint account or work card'),
              Spaces.mediumTopSpace,
              !isNew?Spaces.mediumTopSpace:const SizedBox(),
              isNew?
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Checkbox(
                        value: true,
                        activeColor: HexColor('#2764E7'),
                        checkColor: Colors.white,
                        onChanged: (val){}),
                    Spaces.tinySideSpace,
                    RichText(
                        text: TextSpan(
                          children:[
                            TextSpan(text: 'Accept  ',
                            style: Blacks.smallestBoldPoppins),
                            TextSpan(
                              text: 'Terms and Conditions',
                              style: Oranges.tinyPoppins,
                              recognizer: TapGestureRecognizer()..onTap=()=>
                                  Navigator.pushNamed(context, Routes.termsConditions)
                            )
                          ]
                        ))
                  ],
                ),
              ):const SizedBox(),
              isNew?
                  Center(
                    child: AuthButton(
                        text: 'Link',
                        tapped: (){
                          Navigator.pop(context);
                        }),
                  ):
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                        width: size.width/2.5,
                        child: AuthButton(
                            text: 'Save',
                            tapped: (){
                          Navigator.pop(context);
                        })),
                    SizedBox(
                        width: size.width/2.5,
                        child: AuthButton(
                          color: '#E85D1C',
                            text: 'Delete',
                            tapped: (){
                              Navigator.pop(context);
                            }))
                  ],
                ),
              )
            ],
          ),)
        ],
      ),
    );
  }
}
