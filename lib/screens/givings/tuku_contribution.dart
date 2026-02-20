import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class TukuContribution extends StatefulWidget {
  const TukuContribution({super.key});

  @override
  State<TukuContribution> createState() => _TukuContributionState();
}

class _TukuContributionState extends State<TukuContribution> {
  final amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Consumer3<FundraiserProvider,WalletProvider,ProfileProvider>(
      builder: (_,fundraiserProvider,wallets,profile,__) {
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
                            selectedWallet: fundraiserProvider.contributionWallet,
                            wallets: wallets.userWallets,
                            onSelected: (wallet) {
                              Fluttertoast.cancel();
                              fundraiserProvider.setContributionWallet(wallet);
                            },
                            label: 'Pick the wallet to contribute from',
                            sheetTitle: 'Contribution Wallet',
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
                      if(fundraiserProvider.contributionWallet==null){
                        Fluttertoast.cancel();
                        Fluttertoast.showToast(msg: "Select a wallet to contribute from");
                      }else if(amountController.text.isEmpty){
                        Fluttertoast.cancel();
                        Fluttertoast.showToast(msg: "Enter an amount to contribute");
                      }else{
                        // proceed to payment options
                        String firstName=profile.user?.firstName??"Your";
                        String lastName=profile.user?.lastName??"Name";
                        String contributorEmail=profile.user?.email??"Your Email";
                        String contributorPhone=profile.user?.phoneNumber??"Your Phone";

                        String businessName=profile.user?.businessName??"Business Name";
                        // contribution obj to send
                        final request=ContributionRequest(
                            amount: double.parse(amountController.text),
                            isAnonymous: false,
                            paymentMethod: fundraiserProvider.selectedContributionMethod!.method,
                            walletId: fundraiserProvider.contributionWallet!.id!,
                            contributorName: profile.user?.type==Strings.individualAcc? "$firstName $lastName":businessName,
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
                    text: "Proceed")
              ],
            ));
      }
    );
  }
}
