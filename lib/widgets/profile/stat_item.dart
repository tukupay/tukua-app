import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
class StatItem extends StatelessWidget {
  final int value;
  final String title;
  const StatItem({super.key,
  required this.value,
  required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 45,
      alignment: Alignment.center,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(value.toString(),style: Blacks.regularSemiRoboto),
          //Spaces.smallTopSpace,
          Text(title,style: Grays.smallRoboto)
        ],
      ),
    );
  }
}
