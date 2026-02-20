import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../widgets/widget.dart';

class BankContribution extends StatefulWidget {
  const BankContribution({super.key});

  @override
  State<BankContribution> createState() => _BankContributionState();
}

class _BankContributionState extends State<BankContribution> {
  final amountController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Consumer3<FundraiserProvider, BankingProvider, ProfileProvider>(
        builder: (_, fundraiserProvider, banking, profile, __) {
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
                              selectedBank: fundraiserProvider.contributionBank,
                              userBanks: banking.userBanks,
                              onSelected: (val) {
                                fundraiserProvider.setContributionBank(val);
                              },
                              label: 'Pick the bank to contribute from',
                              sheetTitle: 'Select Bank',
                              sheetSubtitle: 'Choose bank account to contribute from',
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
                      tapped: () async {
                        Fluttertoast.cancel();
                        if (fundraiserProvider.contributionBank == null) {
                          Fluttertoast.showToast(msg: "Pick the bank account to use");
                        }else if(amountController.text.trim().isEmpty){
                          Fluttertoast.showToast(msg: "Enter an amount");
                        }else{
                          String firstName = profile.user?.firstName ?? 'Your';
                          String lastName = profile.user?.lastName ?? 'Name';
                          String contributorEmail = profile.user?.email ?? 'Your email';
                          String contributorPhone = profile.user?.phoneNumber ?? 'Your phone';

                          String businessName=profile.user?.businessName??"Business Name";

                          // contribution obj to send
                          final request=ContributionRequest(
                              amount: double.parse(amountController.text),
                              isAnonymous: false,
                              paymentMethod: fundraiserProvider.selectedContributionMethod!.method,
                              contributorName: profile.user?.type==Strings.individualAcc? '$firstName $lastName': businessName,
                              contributorEmail: contributorEmail,
                              contributorPhone: contributorPhone);
                          // loading alert
                          showAdaptiveDialog(
                              context: context,
                              builder:(context)=> AiAnalysisAlert(
                                  icon: HugeIcons.strokeRoundedMoneySend01,
                                  action: 'Contributing'));
                          await Provider.of<FundraiserProvider>(context,listen: false).contributeToCampaign(request);
                          Provider.of<FundraiserProvider>(context,listen: false).resetContributionFields();
                          Navigator.pop(context);
                          if(fundraiserProvider.contributionResponse?.error==null){
                            Provider.of<TransactionsProvider>(context,listen: false).getSummary();
                            Provider.of<TransactionsProvider>(context,listen: false).getMyTransactions(isRefresh: true);
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
                                        content: 'Your contribution was received',
                                        tapped: (){
                                          Navigator.pop(context);
                                          Navigator.pop(context);
                                        },
                                        anim1: anim1),);
                                }
                            );
                          }
                        }
                      },
                    text: 'Proceed',
                  )
                ],
              ));
        });
  }
}
