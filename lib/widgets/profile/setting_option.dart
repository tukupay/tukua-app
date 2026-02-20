import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
class SettingOption extends StatelessWidget {
  final void Function() tapped;
  final IconData icon;
  final String option;
  final bool? kycVerified;
  final bool? kycPending;
  const SettingOption({super.key,
  required this.tapped,
  required this.icon,
  required this.option,
  this.kycVerified=true,
  this.kycPending=false});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: tapped,
      child: Container(
        alignment: Alignment.center,
        padding: Paddings.tinyHorizontal,
        height: 56,width: size.width,
        color: Colors.white,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                HugeIcon(icon: icon, color: HexColor('#2E384D')),
                Spaces.tinySideSpace,
                Text(option,style: Grays.regularPoppins)
              ],
            ),
            
            Row(
              children: [
                kycPending==true?
                Icon(HugeIcons.strokeRoundedClock01,color: HexColor('EE7D13')):
                kycVerified==true?const SizedBox():
                Icon(HugeIcons.strokeRoundedAlertCircle,color: Colors.red),
                Spaces.smallSideSpace,
                Icon(Icons.arrow_forward_ios,color: HexColor('#2E384D'),
                size: 12),
              ],
            )
          ],
        ),
      ),
    );
  }
}
