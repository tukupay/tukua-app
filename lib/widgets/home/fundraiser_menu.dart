import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';
import '../widget.dart';
class FundraiserMenu extends StatelessWidget {
  const FundraiserMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return MenuCard(title: 'Tools',
        child: Consumer3<ProfileProvider,AppState,WalletProvider>(
          builder: (_,profile,appState,walletProvider,__) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                MenuItem(
                    bgColor: AppColors.primaryGreen,
                    icon: HugeIcons.strokeRoundedMoneySendFlow02,
                    iconColor: Colors.white,
                    menu: 'Bulk Pay',
                    tapped: (){
                      if(profile.user?.profileImg==null){ // kyc not completed
                        Fluttertoast.showToast(msg: Strings.finishKycHint);
                      }
                      //  else if(profile.user?.kycStatus!=Strings.kycVerified){ // kyc not verified
                      //    Fluttertoast.showToast(msg: Strings.kycReviewHint);
                      // }
                      else{
                        Navigator.pushNamed(context, Routes.bulkLanding);
                      }
                    }),
                MenuItem(
                    menu: 'STK POS',
                    bgColor: Colors.white,
                    iconColor: AppColors.primaryGreen,
                    tapped: (){
                      if(profile.user?.profileImg==null){ // kyc not completed
                        Fluttertoast.showToast(msg: Strings.finishKycHint);
                      }
                      // else if(profile.user?.kycStatus!=Strings.kycVerified){ // kyc not verified
                      //   Fluttertoast.showToast(msg: Strings.kycReviewHint);
                      // }
                      else if(profile.user?.posName==null){
                        Navigator.pushNamed(context, Routes.stkPosLanding);
                      }else{
                        Navigator.pushNamed(context, Routes.stkPos);
                      }
                      },
                  icon: HugeIcons.strokeRoundedCoins01),
                MenuItem(
                    menu: 'Bulk SMS',
                    bgColor: Colors.white,
                    iconColor: AppColors.primaryGreen,
                    icon: HugeIcons.strokeRoundedMessageUpload01,
                    tapped: (){
                      if(profile.user?.profileImg==null){ // kyc not completed
                        Fluttertoast.showToast(msg: Strings.finishKycHint);
                      }
                      // else if(profile.user?.kycStatus!=Strings.kycVerified){ // kyc not verified
                      //   Fluttertoast.showToast(msg: Strings.kycReviewHint);
                      // }
                      else{
                        Navigator.pushNamed(context, Routes.bulkSms);
                      }
                    }),
                MenuItem(
                    menu: 'Fundraiser',
                    icon: HugeIcons.strokeRoundedSaveMoneyDollar,
                    bgColor: AppColors.primaryGreen,
                    iconColor: Colors.white,
                    tapped: (){
                      if(profile.user?.profileImg==null){ // kyc not completed
                        Fluttertoast.showToast(msg: Strings.finishKycHint);
                      }
                      // else if(profile.user?.kycStatus!=Strings.kycVerified){ // kyc not verified
                      //   Fluttertoast.showToast(msg: Strings.kycReviewHint);
                      // }
                      else{
                        Navigator.pushNamed(context, Routes.fundraiserPromotions);
                      }
                    }),
              ],
            );
          }
        ));
  }
}
