import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';
import '../../services/services.dart';
import '../../models/models.dart';

class CardPledge extends StatefulWidget {
  const CardPledge({super.key});

  @override
  State<CardPledge> createState() => _CardPledgeState();
}

class _CardPledgeState extends State<CardPledge> {
  final cardNameController=TextEditingController();
  final cardNumberController=TextEditingController();
  final expiryDateController=TextEditingController();
  final securityCodeController=TextEditingController();
  final amountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Flexible(
        child: Consumer<FundraiserProvider>(
            builder: (_,fundraiserProvider,__){
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
                                canGoNext: true,
                                isNumber: true,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly, // Allow only digits
                                  CardNumberFormatter(), // Custom formatter to add spaces
                                ],
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
                          ],
                        ),
                      )),
                  AltGreenButton(
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
                          // pledge obj to send
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
              );
            }));
  }
}
