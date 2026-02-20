import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../widget.dart';
class InstantPay extends StatelessWidget {
  const InstantPay({super.key});

  @override
  Widget build(BuildContext context) {
    return MenuCard(
        title: 'Instant Pay',
        child: Consumer4<ProfileProvider,PaymentsProvider,AppState,WalletProvider>(
          builder: (_,profile,payments,appState,walletProvider,__) {
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                MenuItem(
                  bgColor: AppColors.primaryGreen,
                    icon: HugeIcons.strokeRoundedAdd01,
                    menu: 'Deposit',
                    tapped: (){
                    Provider.of<PaymentsProvider>(context,listen: false).selectType(payments.transactionTypes.firstWhere((el)=>el.type==Strings.walletTopUp));
                    showModalBottomSheet(
                      scrollControlDisabledMaxHeightRatio: 1/1,
                        context: context,
                        builder: (context){
                        return DecoratedSheet(
                          items: payments.paymentMethods.length+1,
                          height: 600,
                          title: 'Select Top Up Method',
                          body: TopUpMethods(),
                        );
                        });
                    }),
                MenuItem(
                  bgColor: Colors.white,
                  icon: HugeIcons.strokeRoundedMoneySendCircle,
                    iconColor: AppColors.primaryGreen,
                    menu: 'Send',
                    tapped: (){
                      Provider.of<PaymentsProvider>(context,listen: false).selectType(payments.transactionTypes.firstWhere((el)=>el.type==Strings.userTransfer));
                      showModalBottomSheet(
                          scrollControlDisabledMaxHeightRatio: 1/1,
                          context: context,
                          builder: (context){
                            return DecoratedSheet(
                              items: payments.paymentMethods.length-1,
                              height: 450,
                              title: 'Select Method',
                              body: SendMethods(),
                            );
                          });
                    }),
                MenuItem(
                    menu: 'Pay Bills',
                    bgColor: Colors.white,
                    iconColor: AppColors.primaryGreen,
                    icon: HugeIcons.strokeRoundedSmartPhone01,
                    tapped: (){
                      if(profile.user?.profileImg==null){ // kyc not completed
                        Fluttertoast.showToast(msg: Strings.finishKycHint);
                      }
                      // else if(profile.user?.kycStatus!=Strings.kycVerified){ // kyc not verified
                      //   Fluttertoast.showToast(msg: Strings.kycReviewHint);
                      // }
                      else{
                        Navigator.pushNamed(context, Routes.lipaNaMpesa);
                      }
                    }),
                MenuItem(
                  bgColor: AppColors.primaryGreen,

                    icon: HugeIcons.strokeRoundedStore02,
                    iconColor: Colors.white,
                    menu: 'Merchants',
                    tapped: (){
                    if(profile.user?.profileImg==null){
                      Fluttertoast.showToast(msg: Strings.finishKycHint);
                    }
                    // else if(profile.user?.kycStatus!=Strings.kycVerified){
                    //   Fluttertoast.showToast(msg: Strings.kycReviewHint);
                    // }
                    else{
                      Navigator.pushNamed(context, Routes.merchants);
                    }
                    })
              ],
            );
          }
        ));
  }
}
