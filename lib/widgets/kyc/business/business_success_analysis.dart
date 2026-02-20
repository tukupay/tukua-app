import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

import '../../../providers/providers.dart';
class BusinessSuccessAnalysis extends StatelessWidget {
  final bool isBusinessCert;
  final LocalKycModel kyc;
  final void Function() pressed;
  const BusinessSuccessAnalysis({super.key,
    this.isBusinessCert=false,
  required this.kyc,
  required this.pressed});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      padding: Paddings.tinyAllSides,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          _successTag(context, isBusinessCert),
          Spaces.smallTopSpace,
          isBusinessCert==true?_businessInfo(kyc):_kraInfo(kyc),
          Spacer(),
          Consumer<KycBusinessProvider>(
              builder: (_,kyc,__){
                return Row(
                  children: [
                    Spacer(),
                    Row(
                      children: [
                        Text('Is something incorrect?',
                            style: Grays.smallestPoppinsHint),
                        Spaces.tinySideSpace,
                        ElevatedButton(
                            onPressed: pressed,
                            style: ElevatedButton.styleFrom(
                                backgroundColor: kyc.deletingKyc?HexColor(AppColors.fadedGreen).withAlpha(85):HexColor(AppColors.primaryGreen),
                                padding: Paddings.smallSymmetric,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(24)
                                ),
                                elevation: 2
                            ),
                            child: Text(
                              kyc.deletingKyc?'Just a sec...':'Try again',
                              style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white
                              ),
                            )),
                      ],
                    ),
                  ],
                );
              })
        ],
      ),
    );
  }
}

Widget _successTag(BuildContext context,bool isBusinessCert){
  final size=MediaQuery.of(context).size;
  return Column(
    children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(Icons.check_circle_outline,color: HexColor(AppColors.primaryGreen),size: 14),
          Spaces.tinySideSpace,
          SizedBox(
              child: Text('Your ${isBusinessCert==true?'business': 'kra'} certificate seems okay',
                  style: Greens.smallBoldJakarta,
                  textAlign: TextAlign.center))
        ],
      ),
      Center(
        child: Container(
          height: 0.5,
          width: size.width / 2.5,
          color: HexColor(AppColors.fadedGreen),
        ),
      ),
    ],
  );
}

Widget _kycInfo(String title,String content){
  return Row(
    children: [
      Text(title,style: Grays.smallestPoppinsHint),
      Spaces.tinySideSpace,
      Text(content,style: Blacks.smallestBolderPoppins,overflow: TextOverflow.ellipsis)
    ],
  );
}

Widget _businessInfo(LocalKycModel kyc){
  return Column(
    children: [
      _kycInfo('Business Name', kyc.businessName??'Not Found'),
      _kycInfo('Business Type', kyc.businessType??'Not Found'),
      _kycInfo('Reg Date', kyc.regDate!=null?DateFormat.yMMMMd().format(DateTime.parse(kyc.regDate!)):'Not Found'),
      _kycInfo('Certificate No', kyc.certNumber??'Not Found'),
    ],
  );
}

Widget _kraInfo(LocalKycModel kyc){
  return Column(
    children: [
      _kycInfo('Taxpayer', kyc.payerName??'Not Found'),
      _kycInfo('Pin Number', kyc.kraPin??'Not Found'),
    ],
  );
}