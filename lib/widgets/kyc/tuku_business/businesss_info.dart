import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class BusinessInfo extends StatelessWidget {
  const BusinessInfo({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30)
      ),
      padding: Paddings.smallHorizontal,
      alignment: Alignment.center,
      child: Consumer2<TukuBusinessKycProvider,ProfileProvider>(
          builder: (_,kyc,profile,__){
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // GestureDetector(
                    //   child: Icon(Icons.arrow_back),
                    // ),
                    Spaces.smallSideSpace,
                    Text('Review your information',style: Blacks.regularSemiRoboto,)
                  ],
                ),
                Spaces.smallTopSpace,
                // PROFILE PIC
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        height: 100,width: 100,
                        decoration: BoxDecoration(
                            border: Border.all(
                                color: HexColor(AppColors.primaryGreen)
                            ),
                            shape: BoxShape.circle,
                            image: DecorationImage(
                                image: kyc.pickedLogo!=null?
                                FileImage(kyc.pickedLogo!):
                                NetworkImage(profile.user!.profileImg!),
                                fit: BoxFit.cover)
                        ),
                      ),
                      // GestureDetector(
                      //   child: Icon(HugeIcons.strokeRoundedPencilEdit02,
                      //       color: HexColor(AppColors.primaryGreen)),
                      // )
                    ],
                  ),
                ),
                Spaces.tinyTopSpace,
                Text('Business Information',style: Blacks.mediumSemiPoppins),
                // BUSINESS NAME
                KycInfoDetail(title: 'Business Name',
                    content:profile.user?.businessName!=null?profile.user!.businessName!:
                    kyc.userKycs.where((el)=>el.docType==Strings.businessCert).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).businessName!),
                // BUSINESS TYPE
                KycInfoDetail(title: 'Business Type',
                    content: profile.user?.businessType!=null?profile.user!.businessType!:
                    kyc.userKycs.where((el)=>el.docType==Strings.businessCert).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).businessType!),
                // REG DATE
                KycInfoDetail(title: 'Reg Date',
                    content: profile.user?.registrationDate!=null?
                    DateFormat.yMMMEd().format(DateTime.parse(profile.user!.registrationDate!)):
                    kyc.userKycs.where((el)=>el.docType==Strings.businessCert).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).regDate??'missing'
                ),
                // CERT NUMBER
                KycInfoDetail(title: 'Certificate No.',
                    content: profile.user?.certificateNumber!=null?profile.user!.certificateNumber!:
                    kyc.userKycs.where((el)=>el.docType==Strings.businessCert).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.businessCert).certNumber??'missing'),
                // PIN NUMBER
                KycInfoDetail(title: 'KRA Pin',
                    content: profile.user?.kraPin!=null?profile.user!.kraPin!:
                    kyc.userKycs.where((el)=>el.docType==Strings.kraPinCert).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.kraPinCert).kraPin??'missing'),
                Spaces.smallTopSpace,
                Center(
                  child: AuthButton(
                      text: 'CLOSE',
                      tapped: (){
                        Navigator.pop(context);
                      }),
                )
              ],
            );
          }),
    );
  }
}
