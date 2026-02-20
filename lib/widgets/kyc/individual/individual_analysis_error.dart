import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';

import '../../../constants/constants.dart';
import '../../../providers/providers.dart';
import '../../../routes.dart';
class IndividualAnalysisError extends StatelessWidget {
  final int kycId;
  final bool isFront;
  const IndividualAnalysisError({super.key,
    required this.kycId,
  required this.isFront});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.warning_amber_sharp,color: HexColor(AppColors.red)),
              Spaces.smallSideSpace,
              SizedBox(
                  width: size.width/2.5,
                  child: Text('There was an error verifying your id',
                      style: Reds.regularSemiInter,
                      textAlign: TextAlign.center)),
            ],
          ),
          Spaces.smallTopSpace,
          Consumer<KycIndividualProvider>(
            builder: (_,kyc,__) {
              return ElevatedButton(
                onPressed: () async{
                  final success = await Provider.of<KycIndividualProvider>(context,listen: false).deleteKyc(kycId,context);
                  if(success && context.mounted){
                    if(!isFront){
                      Provider.of<KycIndividualProvider>(context,listen: false).resetIsFrontId();
                    } else {
                      Provider.of<KycIndividualProvider>(context,listen: false).setIsFrontId();
                    }
                    Navigator.pushNamed(context, Routes.capture);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: kyc.deletingKyc?HexColor(AppColors.fadedGreen).withAlpha(85): HexColor(AppColors.primaryGreen),
                  padding: Paddings.smallSymmetric,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 2,
                ),
                child: Text(
                  kyc.deletingKyc?'Just a sec...': "Capture Again",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
              );
            }
          ),
        ],
      ),
    );
  }
}
