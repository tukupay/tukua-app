import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../widgets/widget.dart';

class AttachDetachBank extends StatelessWidget {
  const AttachDetachBank({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer3<WalletProvider,BankingProvider,PaymentsProvider>(
        builder: (_,walletProvider,banking,payments,__){
          return walletProvider.selectedWallet?.bankAccountId!=null?
          Container(
            padding: Paddings.smallestAllSides,
            decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen),
                borderRadius: BorderRadius.circular(8)
            ),
            child: GestureDetector(
              onTap: (){
                showAdaptiveDialog(
                    context: context,
                    builder: (context)=>ConfirmAlert(
                        text: "Detach Bank",
                        pressed: ()async{
                          showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                            icon: HugeIcons.strokeRoundedBank,
                            action: 'Detaching Bank',
                          ));
                          await Provider.of<WalletProvider>(context,listen: false).detachBankAccount();
                          Navigator.pop(context);
                          Navigator.pop(context);
                        }));
              },
              child: Text("Detach bank",style: Whites.smallestRoboto),
            ),
          ):Container(
            padding: Paddings.smallestAllSides,
            decoration: BoxDecoration(
                color: HexColor(AppColors.primaryGreen),
                borderRadius: BorderRadius.circular(8)
            ),
            child: GestureDetector(
              onTap: (){
                showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    scrollControlDisabledMaxHeightRatio: 1/1,
                    builder: (context){
                      return Padding(
                          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
                      child: DecoratedSheet(
                          title: "Pick a bank account",

                          items: banking.userBanks.length,
                          body: banking.userBanks.isEmpty?
                          EmptySheetBanks():
                          BankAccounts(
                              tapped: (){
                                if(payments.selectedSourceBank==null){
                                  Fluttertoast.showToast(msg: "Please select a bank account");
                                }else{
                                  showAdaptiveDialog(
                                      context: context,
                                      builder: (context)=>ConfirmAlert(
                                          text: "Attach Bank",
                                          pressed: ()async{
                                            showAdaptiveDialog(context: context, builder:(context)=> AiAnalysisAlert(
                                              icon: HugeIcons.strokeRoundedBank,
                                              action: 'Attach Bank',
                                            ));
                                            await Provider.of<WalletProvider>(context,listen: false).attachBankAccount(payments.selectedSourceBank!.id!);
                                            Navigator.pop(context);
                                            Navigator.pop(context);
                                          }));
                                }
                              }),
                          height: 450));
                    });
              },
              child: Text("Attach bank",style: Whites.smallestRoboto),
            ),
          );
        });
  }
}
