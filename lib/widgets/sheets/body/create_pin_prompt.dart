import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../constants/constants.dart';
import '../../../routes.dart';
import '../../widget.dart';

class CreatePinPrompt extends StatelessWidget {
  const CreatePinPrompt({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: Paddings.tinyAllSides,
      child: Column(
        children: [
          Text("You have not set up a pin to use for transactions.",
              style: Blacks.mediumSemiRubik,
              textAlign: TextAlign.center),
          Spaces.mediumTopSpace,
          Text("To transact securely, you are required to provide us with a 4-6 digit long pin for your transactions. Especially those under Ksh. 50,000",
              style: Grays.smallRoboto,
              textAlign: TextAlign.center),
          Spaces.smallTopSpace,
          Icon(HugeIcons.strokeRoundedCircleLockRemove02,
              size: 64,
              color: HexColor(AppColors.red)),
          Spaces.mediumTopSpace,
          AuthButton(
              text: "Create A Pin",
              tapped: (){
                Navigator.pop(context);
                Navigator.pushNamed(context, Routes.transactionPin);
              }),
          Spaces.smallTopSpace,
          AuthButton(
              color: AppColors.primaryOrange,
              text: "Not Now",
              tapped: (){
                Navigator.pop(context);
              })
        ],
      ),
    );
  }
}
