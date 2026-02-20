import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../../../constants/constants.dart';

class IndividualSuccessAnalysis extends StatelessWidget {
  final bool isFront;
  final LocalKycModel kyc;
  const IndividualSuccessAnalysis(
      {super.key, required this.isFront, required this.kyc});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<KycIndividualProvider>(builder: (_, kycProvider, __) {
      return Container(
        padding: Paddings.smallAllSides,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _successTag(context),
            Spaces.smallTopSpace,
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                isFront ? _frontIdInfo(kyc) : _backIdInfo(kyc),
                Spaces.tinySideSpace,
                // CAPTURE AGAIN
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Is something incorrect?',
                          style: Grays.smallestPoppinsHint),
                      Spaces.tinyTopSpace,
                      ElevatedButton(
                        onPressed: () async {
                          final success = await Provider.of<KycIndividualProvider>(context, listen: false).deleteKyc(kyc.kycId!, context);
                          if(success && context.mounted){
                            if(!isFront){
                              Provider.of<KycIndividualProvider>(context, listen: false).resetIsFrontId();
                            } else {
                              Provider.of<KycIndividualProvider>(context, listen: false).setIsFrontId();
                            }
                            Navigator.pushNamed(context, Routes.capture);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kycProvider.deletingKyc
                              ? HexColor(AppColors.fadedGreen).withAlpha(85)
                              : HexColor(AppColors.primaryGreen),
                          padding: Paddings.smallSymmetric,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                          elevation: 2,
                        ),
                        child: Text(
                          kycProvider.deletingKyc ? 'Just a sec...' : "Capture Again",
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.white,
                          ),
                        ),
                      )
                    ],
                  ),
                )
              ],
            )
          ],
        ),
      );
    });
  }
}

Widget _successTag(BuildContext context) {
  final size = MediaQuery.of(context).size;
  return Column(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle_outline,
              color: HexColor(AppColors.primaryGreen), size: 14),
          Spaces.tinySideSpace,
          SizedBox(
              child: Text('Your id seems okay',
                  style: Greens.smallBoldJakarta, textAlign: TextAlign.center)),
        ],
      ),
      Container(
        height: 0.5,
        width: size.width / 2.5,
        color: HexColor(AppColors.fadedGreen),
      )
    ],
  );
}

Widget _kycInfo(String title, String content) {
  return Row(
    children: [
      Text(title, style: Grays.smallestPoppinsHint),
      Spaces.tinySideSpace,
      Text(content, style: Blacks.smallestBolderPoppins,
      overflow: TextOverflow.ellipsis)
    ],
  );
}

Widget _frontIdInfo(LocalKycModel kyc) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _kycInfo('First Name', kyc.firstName ?? ''),
      Spaces.tinyTopSpace,
      _kycInfo('Middle Name', kyc.middleName ?? ''),
      Spaces.tinyTopSpace,
      _kycInfo('Last Name', kyc.lastName ?? ''),
      Spaces.tinyTopSpace,
      _kycInfo('Id Number', kyc.nationalId ?? ''),
      Spaces.tinyTopSpace,
    ],
  );
}

Widget _backIdInfo(LocalKycModel kyc) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _kycInfo('Division', kyc.division ?? ''),
      Spaces.tinyTopSpace,
      _kycInfo('District', kyc.district ?? ''),
      Spaces.tinyTopSpace,
      _kycInfo('Location', kyc.location ?? ''),
      Spaces.tinyTopSpace,
      _kycInfo('Sub Location', kyc.subLocation ?? ''),
      Spaces.tinyTopSpace,
    ],
  );
}
