import 'dart:io';

import 'package:document_camera_frame/document_camera_frame.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';
class DocumentCamera extends StatelessWidget {
  const DocumentCamera({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<TukuIndividualKycProvider>(
        builder: (_,kyc,__) {
          return Stack(
            children: [
              Container(),
              DocumentCameraFrame(
                  frameWidth: 320,
                  frameHeight: 200,
                  bottomFrameContainerChild: Container(
                    alignment: Alignment.centerLeft,
                    child: Text(kyc.isFrontId? 'Your Front ID':'Your Back ID',
                      style: Blacks.regularBoldCodeNext,
                    ),
                  ),
                  onRetake: (){
                    Provider.of<CameraProvider>(context,listen: false).resetCapturedId();
                  },
                  onCaptured: (imgPath)async{
                    bool fileExists=await File(imgPath).exists();
                    if(!fileExists){
                      debugPrint('==> Hold your phone still <==');
                    }else{
                      debugPrint('==> Your Img has been captured <==');
                    }
                  },
                  onSaved: (imgPath)async{
                    Provider.of<CameraProvider>(context,listen: false).setCapturedId(imgPath);
                    Navigator.pushNamed(context, Routes.capturedImg);
                  }),
            ],
          );
        }
      ),
    );
  }
}
