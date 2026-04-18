import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import '../../../constants/constants.dart';
import '../../../providers/providers.dart';
import '../../../routes.dart';
import '../../widget.dart';
class BackId extends StatelessWidget {
  const BackId({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<TukuIndividualKycProvider>(
      builder: (context, kyc, child) {
        return DottedFileArea(
          color: kyc.submittingBackId? AppColors.darkerGray: null,
          tapped: (){
            // ON PUSHING CAMERA, SET THAT BACK ID IS BEING CAPTURED
            if(kyc.userKycs.where((el)=>el.docType==Strings.backId).isEmpty){
              Provider.of<TukuIndividualKycProvider>(context,listen: false).resetIsFrontId();
              Navigator.pushNamed(context, Routes.capture);
            }
          },
          child: Center(
            // SUBMITTING BACK ID
              child: kyc.submittingBackId?
                  ProgressSwitcher():
              // ### IF NO BACK ID HAS BEEN UPLOADED ###
              kyc.userKycs.where((el)=>el.docType==Strings.backId).isEmpty
                  ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_card,
                    size: 50,
                    color: HexColor('15411D'),
                  ),
                  SizedBox(height: 16),
                  Text(
                    "Tap to capture the Back of your ID",
                    style: Grays.regularLightSemiPoppins,
                  ),
                ],
              ):
                  // ## IF BACK ID WAS UPLOADED BUT ANALYSIS IS NULL ##
                  kyc.userKycs.firstWhere((el)=>el.docType==Strings.backId).division==null?
                      IndividualAnalysisError(
                          isFront: false,
                      kycId: kyc.userKycs.firstWhere((el)=>el.docType==Strings.backId).kycId!):
                      IndividualSuccessAnalysis(
                          isFront: false,
                      kyc: kyc.userKycs.firstWhere((el)=>el.docType==Strings.backId))
          ),
        );
      },
    );
  }
}
