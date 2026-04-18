import 'dart:io';

import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class Selfie extends StatelessWidget {
  const Selfie({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer2<TukuIndividualKycProvider,CameraProvider>(
      builder: (_,kyc,camera,__) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                "Take a Selfie",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                "Ensure your face is clearly visible. We use this to match your ID photo.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 24),
              kyc.userKycs.where((el)=>el.docType==Strings.selfie).isEmpty|| kyc.submittingSelfie ?
              buildSelfieCaptureBox(
                  context, onTap: () {
                Provider.of<TukuIndividualKycProvider>(context,listen: false).setIsSelfie();
                Navigator.pushNamed(context, Routes.capture);
              })
                  : Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(96),
                    child: camera.capturedSelfie!=null?
                    Image.file(File(camera.capturedSelfie!.path),
                        width: 160, height: 160, fit: BoxFit.cover):
                    Image.network(kyc.userKycs.where((el)=>el.docType==Strings.selfie).first.fileUrl!,
                        width: 160, height: 160, fit: BoxFit.cover
                    ),
                  ),
                  const SizedBox(height: 12),
                  // ### IF SELFIE WAS UPLOADED BUT ANALYSIS IS NULL ###
                  kyc.userKycs.firstWhere((el)=>el.docType==Strings.selfie).isFace==null?
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.warning_amber_sharp,color: HexColor(AppColors.red)),
                        Spaces.smallSideSpace,
                        SizedBox(
                            width: size.width/2.5,
                            child: Text('There was an error verifying your face',
                                style: Reds.regularSemiInter,
                                textAlign: TextAlign.center)),
                      ],
                    ),
                  ):
                  const SizedBox(),
                  ElevatedButton(
                    onPressed: ()async{
                      if(!kyc.deletingKyc){
                        Provider.of<TukuIndividualKycProvider>(context,listen: false).setIsSelfie();
                        int selfieKycId=kyc.userKycs.where((el)=>el.docType==Strings.selfie).first.kycId!;
                        await Provider.of<TukuIndividualKycProvider>(context,listen: false).deleteKyc(selfieKycId,context);
                        Navigator.pushNamed(context, Routes.capture);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor:kyc.deletingKyc?Color(0xFF15411D).withAlpha(85): const Color(0xFF15411D),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    child:  Text(kyc.deletingKyc?'Just a sec': "Retake Selfie", style: TextStyle(color: Colors.white)),
                  )
                ],
              ),
            ],
          ),
        );
      }
    );
  }
}

Widget buildSelfieCaptureBox(BuildContext context, {required VoidCallback onTap}) {
  return Consumer<TukuIndividualKycProvider>(
    builder: (_,kyc,__) {
      return DottedFileArea(
        tapped: onTap,
        child: Center(
          // ### SUBMITTING SELFIE ###
          child: kyc.submittingSelfie?
              Text('data'):
          // ### NO SELFIE ###
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.camera_alt, size: 50, color: Color(0xFF15411D)),
              SizedBox(height: 12),
              Text("Tap to take selfie", style: TextStyle(fontSize: 16)),
            ],
          ),
        ),
      );
    }
  );
}
