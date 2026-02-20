import 'dart:io';

import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class KycUploadPrompt extends StatelessWidget {
  const KycUploadPrompt({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12,vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            children: [
              IconButton(
                icon: Icon(Icons.arrow_back, color: HexColor('15411D')),
                onPressed: () => Navigator.of(context).pop(),
              ),
              Spaces.smallSideSpace,
              Text("Verify Your Identity", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            ],
          ),
          SizedBox(height: 10),
          Text(
            "Please upload both sides of your government-issued ID",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          Spaces.mediumTopSpace,
          // buildUploadSection("Front of ID", Icons.credit_card, (){
          //   Provider.of<ProfileProvider>(context,listen: false).setIsFront(true);
          //   Navigator.pushNamed(context, Routes.captureId);
          // }, true),
          Spaces.smallTopSpace,
          Spaces.smallTopSpace,
          // buildUploadSection("Back of ID", , (){
          //
          // }, false),
          Spaces.smallTopSpace,
          Spaces.smallTopSpace,
          Text(
            "You will be able to transact once we have verified these documents.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          Spaces.mediumTopSpace,
          // Consumer<ProfileProvider>(
          //   builder: (_,profile,__) {
          //     return AuthButton(
          //       enabled: profile.frontId!=null && profile.backId!=null,
          //         text: 'Submit', tapped: (){
          //           if(profile.frontId!=null && profile.backId!=null){
          //             Provider.of<ProfileProvider>(context, listen: false).updateKYCPending();
          //           }
          //     });
          //   }
          // )
        ],
      ),
    );
  }
}
