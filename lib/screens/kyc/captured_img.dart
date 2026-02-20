import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../routes.dart';
class CapturedImg extends StatelessWidget {
  const CapturedImg({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer2<KycIndividualProvider,CameraProvider>(
        builder: (_,kyc,camera,__) {
          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Here is your captured ${kyc.isSelfie?'Selfie': kyc.isFrontId? 'Front ID':'Back ID'}',
              style: Blacks.regularBoldCodeNext),
              Spaces.smallTopSpace,
              !kyc.isSelfie?
              Text('Please ensure the details in your id are visible',
              style: Grays.smallestPoppinsHint):SizedBox(),
              Padding(
                padding: Paddings.smallAllSides,
                child: Center(
                  child: kyc.isSelfie? camera.capturedSelfie!=null?
                  Image.file(File(camera.capturedSelfie!.path), // show selfie
                  fit: BoxFit.contain):
                      const SizedBox():
                      camera.capturedId!=null?
                  Image.file(camera.capturedId!, // show captured id
                  fit: BoxFit.cover,
                  height: 200,width: 320,):const SizedBox(),
                ),
              ),
              Spaces.smallTopSpace,
              Consumer<KycIndividualProvider>(
                builder: (_,kyc,__) {
                  return AuthButton(
                      text: 'SUBMIT',
                      enabled: kyc.submittingSelfie!=true,
                      tapped: ()async{
                        final kycProvider=Provider.of<KycIndividualProvider>(context,listen: false);
                        final cameraProvider=Provider.of<CameraProvider>(context,listen: false);
                        final authProvider=Provider.of<AuthProvider>(context,listen: false);
                        // if(!kyc.isSelfie){
                        //   Navigator.pop(context); // pop captured img screen
                        //   Navigator.pop(context); // pop camera
                        // }

                        WidgetsBinding.instance.addPostFrameCallback((_)async{
                          bool success=false;
                          if(kyc.isSelfie){
                            // BUILD ANALYSIS ALERT
                            showAdaptiveDialog(
                                context: context,
                                barrierDismissible: false,
                                builder: (context)=>AiAnalysisAlert(action: 'Analyzing...'));
                            success=await kycProvider.submitSelfie(cameraProvider,authProvider);
                            Navigator.pop(context); // pop ai alert
                            Navigator.pop(context); // pop captured img screen
                            Navigator.pop(context); // pop camera
                          }else{
                            Navigator.pop(context); // pop captured img screen
                            Navigator.pop(context); // pop camera
                            if(kyc.isFrontId){
                              success= await kycProvider.submitFrontId(cameraProvider,authProvider);
                            }else{
                              success= await kycProvider.submitBackId(cameraProvider,authProvider);
                            }
                          }
                          // handle failed
                          if(!success && context.mounted){
                            Navigator.pushReplacementNamed(context, Routes.login);
                          }
                        });
                      });
                }
              ),
              Spaces.smallTopSpace,
              AuthButton(
                color: AppColors.primaryOrange,
                  text: 'Capture Again',
                  tapped: (){
                  if(kyc.isSelfie){
                    Provider.of<CameraProvider>(context,listen: false).resetCapturedSelfie();
                  }else{
                    Provider.of<CameraProvider>(context,listen: false).resetCapturedId();
                  }
                    Navigator.pop(context);
                  })
            ],
          );
        }
      )
    );
  }
}
