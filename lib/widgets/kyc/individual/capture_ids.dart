import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class CaptureIds extends StatelessWidget {
  const CaptureIds({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
        padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            "Upload The Front Side of Your Government-Issued ID",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          Spaces.smallTopSpace,
          Text(
            "This should clearly show your name, ID number, and photo.",
            style: Blacks.regularThinPoppins,
            textAlign: TextAlign.center,
          ),
          Spaces.mediumTopSpace,
          FrontId(),
          Spaces.smallTopSpace,
          BackId(),
          Spaces.smallTopSpace
        ],
      ),
    );
  }
}
