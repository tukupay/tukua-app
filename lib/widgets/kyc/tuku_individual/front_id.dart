import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/widgets/widget.dart';

import '../../../constants/constants.dart';
import '../../../providers/providers.dart';
import '../../../routes.dart';
class FrontId extends StatelessWidget {
  const FrontId({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<TukuIndividualKycProvider>(
      builder: (context, kyc, child) {
        return DottedFileArea(
          color: kyc.submittingFrontId? AppColors.darkerGray: null,
          tapped: (){
            // ON PUSHING CAMERA, SET THAT FRONT ID IS BEING CAPTURED
            if(kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty){
              Navigator.pushNamed(context, Routes.capture);
            }
          },
          child: Center(
            // ## SUBMITTING FRONT ID
              child: kyc.submittingFrontId?
                  ProgressSwitcher() :
              // ### IF NO FRONT ID HAS BEEN UPLOADED ###
              kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty
                  ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_card,
                    size: 50,
                    color: HexColor(AppColors.primaryGreen)),
                  SizedBox(height: 16),
                  Text(
                    "Tap to capture the Front of your ID",
                    style: Grays.regularLightSemiPoppins,
                  ),
                ],
              )
              // ### IF FRONT ID WAS UPLOADED BUT ANALYSIS IS NULL ###
                  : kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).firstName==null?
                  IndividualAnalysisError(
                      isFront: true,
                    kycId: kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).kycId!):
                      IndividualSuccessAnalysis(
                          isFront: true,
                      kyc: kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId))
          ),
        );
      },
    );
  }
}
