import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';

import '../../../constants/constants.dart';
import '../../widget.dart';
class IdInfo extends StatelessWidget {
  final bool isHome;
  const IdInfo({super.key,
  this.isHome=false});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30)
      ),
        padding: Paddings.smallHorizontal,
        alignment: Alignment.center,
        child: Consumer3<KycIndividualProvider,CameraProvider,ProfileProvider>(
          builder: (_,kyc,camera,profile,__) {
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
                                image: camera.capturedSelfie!=null?
                                FileImage(camera.capturedSelfie!):
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
                // ID INFO.
                Text('ID Information',style: Blacks.mediumSemiPoppins),
                // FIRST NAME
                KycInfoDetail(title: 'First Name',
                    content:profile.user?.firstName!=null?profile.user!.firstName!:
                    kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty?'missing':
                  kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).firstName!),
                // SECOND NAME
                KycInfoDetail(title: 'Middle Name',
                    content: profile.user?.middleName!=null?profile.user!.middleName!:
                    kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).middleName!),
                // THIRD NAME
                KycInfoDetail(title: 'Last Name',
                    content: profile.user?.lastName!=null?profile.user!.lastName!:
                    kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).lastName??'/'),
                // ID NUMBER
                KycInfoDetail(title: 'ID Number',
                    content: profile.user?.nationalId!=null?profile.user!.nationalId!:
                    kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).nationalId??'missing'),
                // D.O.B
                KycInfoDetail(title: 'D.O.B',
                    content: profile.user?.dob!=null?
                    DateFormat.yMMMEd().format(DateTime.parse(profile.user!.dob!)):
                    kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).dob??'missing'),
                // GENDER
                KycInfoDetail(title: 'Gender',
                    content: profile.user?.gender!=null?profile.user!.gender!:
                    kyc.userKycs.where((el)=>el.docType==Strings.frontId).isEmpty?'missing':
                    kyc.userKycs.firstWhere((el)=>el.docType==Strings.frontId).gender??'missing'),
                // Area Of Issue
                // KycInfoDetail(title: 'Hometown',
                //     content: profile.user?.location!=null?profile.user!.location!:
                //     kyc.userKycs.where((el)=>el.docType==Strings.backId).isEmpty?'missing':
                //     kyc.userKycs.firstWhere((el)=>el.docType==Strings.backId).location??'missing'),
                Spaces.smallTopSpace,
                Center(
                  child: AuthButton(
                      text: isHome?'CLOSE': 'CONFIRM',
                      tapped: (){
                        Navigator.pop(context);
                        if(!isHome){
                          TextEditingController usernameController=Provider.of<AuthProvider>(context,listen: false).usernameController;
                          usernameController.text=profile.user!.username!;
                          Provider.of<KycIndividualProvider>(context,listen: false).nextStep();
                        }
                      }),
                )
              ],
            );
          }
        )
    );
  }
}
