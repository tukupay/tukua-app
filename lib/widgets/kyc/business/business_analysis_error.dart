import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../widget.dart';
class BusinessAnalysisError extends StatelessWidget {
  final bool isBusinessCert;
  final void Function() pressed;
  const BusinessAnalysisError({super.key,
  required this.isBusinessCert,
  required this.pressed});

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
                child: Text('There was an error verifying your ${isBusinessCert? 'business':'kra pin'} certificate',
                style: Reds.regularSemiInter,
                textAlign: TextAlign.center))
            ],
          ),
          Spaces.smallTopSpace,
          Consumer<KycBusinessProvider>(
              builder: (_,kyc,__){
                return ElevatedButton(
                    onPressed: pressed,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kyc.deletingKyc?HexColor(AppColors.fadedGreen).withAlpha(85):HexColor(AppColors.primaryGreen),
                      padding: Paddings.smallSymmetric,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)
                      ),
                      elevation: 2
                    ),
                    child: Text(
                      kyc.deletingKyc?'Just a sec...':'Pick another file',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white
                      ),
                    ));
              })
        ],
      ),
    );
  }
}
