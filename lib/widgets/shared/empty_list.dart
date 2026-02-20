import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../constants/constants.dart';

class EmptyList extends StatelessWidget {
  final IconData icon;
  final String hint;
  const EmptyList({super.key,
  required this.icon,
  required this.hint});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return SizedBox(
      height: size.height/2,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon,
              color: HexColor(AppColors.darkerGray),size: 56),
          Spaces.smallTopSpace,
          Text(hint,
              style: Grays.mediumPoppins,
              textAlign: TextAlign.center)
        ],
      ),
    );
  }
}
