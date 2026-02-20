import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../constants/constants.dart';
class InfoNote extends StatelessWidget {
  final String text;

  const InfoNote({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: HexColor(AppColors.primaryGreen).withAlpha(30),
        ),
      ),
      child: Row(
        children: [
          Icon(
            HugeIcons.strokeRoundedInformationCircle,
            size: 18,
            color: HexColor(AppColors.primaryGreen),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 11,
                color: HexColor(AppColors.primaryGreen),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
