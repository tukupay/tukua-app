import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../services/services.dart';
import '../../constants/constants.dart';

class CardContribution extends StatefulWidget {
  const CardContribution({super.key});

  @override
  State<CardContribution> createState() => _CardContributionState();
}

class _CardContributionState extends State<CardContribution> {
    final cardNameController=TextEditingController();
    final cardNumberController=TextEditingController();
    final expiryDateController=TextEditingController();
    final securityCodeController=TextEditingController();
    final amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Flexible(
        child: Consumer2<FundraiserProvider,ProfileProvider>(
            builder: (_,fundraiserProvider,profile,__){
              return Column(
                children: [
                  Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Spaces.smallTopSpace,
                            LabeledField(
                                controller: cardNameController,
                                label: 'Enter Card Name',
                                hint: 'eg PETER GRIFFIN',
                                canGoNext: true,
                                enabled: true),
                            Spaces.smallTopSpace,
                            // card number
                            LabeledField(
                                label: 'Card Number',
                                hint: '0000 0000 0000 0000',
                                controller: cardNumberController,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly, // Allow only digits
                                    CardNumberFormatter(), // Custom formatter to add spaces
                                  ],
                                canGoNext: true,
                                isNumber: true,
                                 enabled: true),
                            Spaces.smallTopSpace,
                            Row(
                              children: [
                                // expiry date
                                Flexible(
                                  child: LabeledField(
                                    label: 'Expiration Date',
                                    hint: 'MM/YYYY',
                                    controller: expiryDateController,
                                    canGoNext: true,
                                    isNumber: true,
                                    enabled: true,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly, // Allow only digits
                                      ExpiryDateFormatter(), // Custom formatter to insert "/"
                                    ],
                                  ),
                                ),
                                Spaces.smallSideSpace,
                                // security code
                                Flexible(
                                  child: LabeledField(
                                      label: 'Security Code',
                                      hint: 'CVV/CVC',
                                      canGoNext: true,
                                      controller: securityCodeController,
                                      isNumber: true,
                                      enabled: true),
                                )
                              ],
                            ),
                            Spaces.smallTopSpace,
                            LabeledField(
                                label: 'Amount',
                                hint: 'KSH',
                                controller: amountController,
                                isNumber: true,
                                enabled: true),
                          ]))),
                  AuthButton(
                    tapped: ()async{
                      Fluttertoast.cancel();
                      if(cardNameController.text.isEmpty){
                        Fluttertoast.showToast(msg: "Enter card name");
                      }else if(cardNumberController.text.isEmpty){
                        Fluttertoast.showToast(msg: "Enter card number");
                      }else if(expiryDateController.text.isEmpty){
                        Fluttertoast.showToast(msg: "Enter expiry date");
                      }else if(securityCodeController.text.isEmpty){
                        Fluttertoast.showToast(msg: "Enter security code");
                      } else if(amountController.text.trim().isEmpty){
                        Fluttertoast.showToast(msg: "Enter an amount");
                      }else{
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
              );
            }));
  }
}
