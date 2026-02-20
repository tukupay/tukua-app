import 'dart:io';
import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import '../../widget.dart';
class Logo extends StatelessWidget {
  const Logo({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return  Consumer<KycBusinessProvider>(
      builder: (_,kyc,__) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text('Pick your logo',
              style: TextStyle(fontSize: 18,fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Ensure your logo is clearly visible. We use this to match your profile photo',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600])),
              const SizedBox(height: 24),
              kyc.userKycs.where((el)=>el.docType==Strings.selfie).isEmpty&&
                  kyc.pickedLogo==null?
                  buildLogoPickerBox(context,
                      onTap: ()async{
                        // pick logo
                        await Provider.of<KycBusinessProvider>(context,listen: false).pickLogo();
                        await Provider.of<KycBusinessProvider>(context,listen: false).submitLogo(context);
                        await Provider.of<KycBusinessProvider>(context,listen: false).nextStep();
                      })
                  :Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(96),
                    child: kyc.pickedLogo!=null?
                    Image.file(File(kyc.pickedLogo!.path),
                    height: 160,width: 160,
                    fit: BoxFit.cover):
                    Image.network(kyc.userKycs.where((el)=>el.docType==Strings.selfie).first.fileUrl!,
                    width: 160,height: 160,fit: BoxFit.cover),
                  )
                ],
              )
            ]));
      }
    );
  }
}

Widget buildLogoPickerBox(BuildContext context, {required VoidCallback onTap}) {
  return DottedFileArea(
    tapped: onTap,
    child: const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.camera_alt, size: 50, color: Color(0xFF15411D)),
          SizedBox(height: 12),
          Text("Tap to upload logo", style: TextStyle(fontSize: 16)),
        ],
      ),
    ),
  );
}
