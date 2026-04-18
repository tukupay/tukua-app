import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import '../../../constants/constants.dart';
import '../../../providers/providers.dart';
import '../../widget.dart';

class KraPin extends StatelessWidget {
  const KraPin({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<TukuBusinessKycProvider>(
        builder: (_,kyc,__) {
          return InkWell(
            onTap: ()async{
              // pick kra cert. file
              bool picked= await Provider.of<TukuBusinessKycProvider>(context,listen: false).pickKraCert();
              if(picked==true){
                await Provider.of<TukuBusinessKycProvider>(context,listen: false).submitKraCert(context);
              }
            },
            child: DottedFileArea(
                child: Center(
                  // ### SUBMITTING KRA PIN CERT.
                    child: kyc.submittingKraPin ? ProgressSwitcher():
                    // ### IF NO KRA PIN CERT. HAS BEEN UPLOADED ###
                    kyc.userKycs.where((el)=>el.docType==Strings.kraPinCert).isEmpty?
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(Icons.file_copy,size: 50,
                            color: HexColor(AppColors.primaryGreen)),
                        SizedBox(height: 16),
                        Text('Tap to pick your KRA Pin certificate',
                            style: Grays.regularLightSemiPoppins)
                      ],
                    )
                    // ### IF DOC WAS UPLOADED BUT ANALYSIS IS NULL ###
                        :kyc.userKycs.firstWhere((el)=>el.docType==Strings.kraPinCert).kraPin==null?
                    BusinessAnalysisError(
                        isBusinessCert: false,
                        pressed: ()async{
                          int kycId=kyc.userKycs.firstWhere((el)=>el.docType==Strings.kraPinCert).kycId!;
                          bool deleted=await Provider.of<TukuBusinessKycProvider>(context,listen: false).deleteKyc(kycId, context);
                          if(deleted){
                            // pick another file
                            bool picked= await Provider.of<TukuBusinessKycProvider>(context,listen: false).pickKraCert();
                            if(picked==true){
                              await Provider.of<TukuBusinessKycProvider>(context,listen: false).submitKraCert(context);
                            }
                          }
                        }):
                    BusinessSuccessAnalysis(
                      kyc: kyc.userKycs.firstWhere((el)=>el.docType==Strings.kraPinCert),
                      pressed: ()async{
                        int kycId=kyc.userKycs.firstWhere((el)=>el.docType==Strings.kraPinCert).kycId!;
                        bool deleted=await Provider.of<TukuBusinessKycProvider>(context,listen: false).deleteKyc(kycId, context);
                        if(deleted){
                          // pick another file
                          bool picked= await Provider.of<TukuBusinessKycProvider>(context,listen: false).pickKraCert();
                          if(picked==true){
                            await Provider.of<TukuBusinessKycProvider>(context,listen: false).submitKraCert(context);
                          }
                        }
                      },
                    )
                )),
          );
        }
    );
  }
}
