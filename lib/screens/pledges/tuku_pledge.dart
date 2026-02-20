import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';

class TukuPledge extends StatefulWidget {
  const TukuPledge({super.key});

  @override
  State<TukuPledge> createState() => _TukuPledgeState();
}

class _TukuPledgeState extends State<TukuPledge> {
  final amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Consumer2<FundraiserProvider,WalletProvider>(
        builder: (_,fundraiserProvider,wallets,__){
          return Flexible(
              child: Column(
                children: [
                  Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Spaces.smallTopSpace,
                            // source wallet
                            wallets.userWallets.isEmpty?
                            EmptyAccountsHint():
                            WalletSelectorCard(
                              selectedWallet: fundraiserProvider.pledgeWallet,
                              wallets: wallets.userWallets,
                              onSelected: (wallet) {
                                Fluttertoast.cancel();
                                fundraiserProvider.setPledgeWallet(wallet);
                              },
                              label: 'Pick the wallet to pledge from',
                              sheetTitle: 'Pledge Wallet',
                              sheetSubtitle: 'Funds will be deducted from this wallet',
                              isSource: true,
                            ),
                            Spaces.smallTopSpace,
                            // amount
                            LabeledField(
                                label: 'Enter Amount',
                                hint: '0',
                                controller: amountController,
                                isNumber: true,
                                enabled: true),
                          ],
                        ),
                      )),
                  AuthButton(
                      tapped: ()async{
                        Fluttertoast.cancel();
                        if(fundraiserProvider.pledgeWallet==null){
                          Fluttertoast.showToast(msg: "Pick the wallet to use");
                        }else if(amountController.text.trim().isEmpty){
                          Fluttertoast.showToast(msg: "Enter an amount");
                        }else{
                          // contribution obj to send
                          final request=PledgePaymentRequest(
                            amount: double.parse(amountController.text),
                            paymentMethod: fundraiserProvider.selectedPledgeMethod!.method,
                            walletId: fundraiserProvider.pledgeWallet?.id,);
                          // loading alert
                          showAdaptiveDialog(
                              context: context,
                              builder:(context)=> AiAnalysisAlert(
                                  icon: HugeIcons.strokeRoundedMoneySend01,
                                  action: 'Processing..'));
                          await Provider.of<FundraiserProvider>(context,listen: false).processPledgePayment(fundraiserProvider.selectedPledge!.id!,request);
                          Navigator.of(context).pop(); // root context
                          if(fundraiserProvider.contributionResponse?.error==null){
                            showGeneralDialog(
                                context: context,
                                pageBuilder: (context,anim1,anim2){
                                  return const SizedBox();
                                },
                                transitionDuration: const Duration(milliseconds: 400),
                                transitionBuilder: (context,anim1,anim2,child){
                                  return SlideTransition(
                                    position: Tween(
                                        begin: const Offset(1, 0),
                                        end: const Offset(0, 0)
                                    ).animate(anim1),
                                    child: SuccessAlert(
                                        title: 'Operation Successful',
                                        content: 'Your Pledge payment was completed',
                                        tapped: (){
                                          Navigator.pop(context);
                                          Navigator.pop(context);
                                          Provider.of<FundraiserProvider>(context,listen: false).resetPledgingFields();
                                          Navigator.pop(context);
                                        },
                                        anim1: anim1),);
                                }
                            );
                          }
                        }
                      },
                      text: "Proceed")
                ],
              ));
        });
  }
}
