import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class BusinessCerts extends StatelessWidget {
  const BusinessCerts({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
        padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Text('Upload your business\' certificate of registration & your KRA Pin Certificate',
        style: TextStyle(fontWeight: FontWeight.bold,fontSize: 18),
        textAlign: TextAlign.center),
        Spaces.smallTopSpace,
        Text('This should clearly show your Company details and name',
        style: Blacks.regularThinPoppins,
        textAlign: TextAlign.center),
        Spaces.mediumTopSpace,
        Certification(),
        Spaces.smallTopSpace,
        KraPin(),
        Spaces.smallTopSpace,
      ],
    ),);
  }
}
