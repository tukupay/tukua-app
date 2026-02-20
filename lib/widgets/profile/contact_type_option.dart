import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';

class ContactTypeOption extends StatelessWidget {
  final void Function()? tapped;
  final IconData icon;
  final String title;
  final String subtitle;
  const ContactTypeOption({super.key,
  required this.tapped,
  required this.icon,
  required this.title,
  required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: tapped,
      child: Container(
        padding: Paddings.tinyAllSides,
        width: size.width,
        height: 80,
        decoration: BoxDecoration(
            border: Border.all(
                color: HexColor(AppColors.lightGray)),
            borderRadius: BorderRadius.circular(14)
        ),
        child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: Paddings.tinyAllSides,
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: HexColor(AppColors.primaryGreen)),
                child: Icon(icon,color: Colors.white),
              ),
              Spaces.smallSideSpace,
              Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,style: Blacks.regularBoldCodeNext),
                      Text(subtitle,style: Grays.tinyPoppinsHint)
                    ],
                  )),
              Spaces.smallSideSpace,
              Icon(Icons.keyboard_arrow_right_outlined)
            ]
        ),
      ),
    );
  }
}
