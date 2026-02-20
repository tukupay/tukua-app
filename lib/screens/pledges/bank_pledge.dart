import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import '../../providers/providers.dart';
import '../../widgets/widget.dart';
import '../../models/models.dart';

class BankPledge extends StatefulWidget {
  const BankPledge({super.key});

  @override
  State<BankPledge> createState() => _BankPledgeState();
}

class _BankPledgeState extends State<BankPledge> {
  final amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Consumer2<FundraiserProvider,BankingProvider>(
        builder: (_,fundraiserProvider,banking,__){
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
                            banking.userBanks.isEmpty
                                ? const EmptyAccountsHint(isBank: true)
                                : UserBankSelectorCard(
                                    selectedBank: fundraiserProvider.pledgeBank,
                                    userBanks: banking.userBanks,
                                    onSelected: (val) {
                                      Fluttertoast.cancel();
                                      fundraiserProvider.setPledgeBank(val);
                                    },
                                    label: 'Pick the bank to pledge from',
                                    sheetTitle: 'Select Bank',
                                    sheetSubtitle: 'Choose bank account to pledge from',
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
                  AltGreenButton(
                      tapped: ()async{
                        Fluttertoast.cancel();
                        if(fundraiserProvider.pledgeBank==null){
                          Fluttertoast.showToast(msg: "Pick the bank to use");
                        }else if(amountController.text.trim().isEmpty){
                          Fluttertoast.showToast(msg: "Enter an amount");
                        }else{
                          // pledge obj to send
                          final request=PledgePaymentRequest(
                            amount: double.parse(amountController.text),
                            paymentMethod: fundraiserProvider.selectedPledgeMethod!.method);
                            // walletId: fundraiserProvider.pledgeWallet?.id
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
