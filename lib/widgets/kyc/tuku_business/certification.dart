import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class Certification extends StatelessWidget {
  const Certification({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<TukuBusinessKycProvider>(
      builder: (_,kyc,__) {
        return InkWell(
          onTap: ()async{
            // pick business cert. file
            bool picked=await Provider.of<TukuBusinessKycProvider>(context,listen: false).pickBusinessCert();
           if(picked==true){
             await Provider.of<TukuBusinessKycProvider>(context,listen: false).submitBusinessCert(context);
           }
          },
          child: DottedFileArea(
              child: Center(
                // ### SUBMITTING BUSINESS CERT.
                child: kyc.submittingBusinessCert?
                    ProgressSwitcher():
                // ### IF NO BUSINESS CERT. HAS BEEN UPLOADED ###
                kyc.userKycs.where((el)=>el.docType==Strings.businessCert).isEmpty?
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(Icons.file_copy,size: 50,
                    color: HexColor(AppColors.primaryGreen)),
                    SizedBox(height: 16),
                    Text('Tap to pick your business certificate',
                    style: Grays.regularLightSemiPoppins)
                  ],
                )
                    // ### IF DOC WAS UPLOADED BUT ANALYSIS IS NULL ###
                :kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).certNumber==null?
                    BusinessAnalysisError(
                      isBusinessCert: true,
                      pressed: ()async{
                        int kycId=kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).kycId!;
                        bool deleted=await Provider.of<TukuBusinessKycProvider>(context,listen: false).deleteKyc(kycId, context);
                       if(deleted){
                         // pick another file
                         bool picked=await Provider.of<TukuBusinessKycProvider>(context,listen: false).pickBusinessCert();
                         if(picked==true){
                           await Provider.of<TukuBusinessKycProvider>(context,listen: false).submitBusinessCert(context);
                         }
                       }
                      }):
                    BusinessSuccessAnalysis(
                      isBusinessCert: true,
                      kyc: kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert),
                    pressed: ()async{
                      int kycId=kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).kycId!;
                      bool deleted=await Provider.of<TukuBusinessKycProvider>(context,listen: false).deleteKyc(kycId, context);
                      if(deleted){
                        // pick another file
                        bool picked=await Provider.of<TukuBusinessKycProvider>(context,listen: false).pickBusinessCert();
                        if(picked==true){
                          await Provider.of<TukuBusinessKycProvider>(context,listen: false).submitBusinessCert(context);
                        }
                      }
                    },)
              )),
        );
      }
    );
  }
}


