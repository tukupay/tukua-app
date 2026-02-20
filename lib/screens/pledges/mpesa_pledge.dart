import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../constants/constants.dart';
import '../../widgets/widget.dart';
import '../../models/models.dart';

class MpesaPledge extends StatefulWidget {
  const MpesaPledge({super.key});

  @override
  State<MpesaPledge> createState() => _MpesaPledgeState();
}

class _MpesaPledgeState extends State<MpesaPledge> {
  final phoneController=TextEditingController();
  final amountController=TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_){
      final profileProvider = Provider.of<ProfileProvider>(context,listen: false);
      if(profileProvider.user?.phoneNumber!=null){
        phoneController.text=convertToLocalKenyanFormat(profileProvider.user!.phoneNumber??'')!;
      }
    });
  }

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
                                label: 'Enter Phone no.',
                                hint: '0701234567',
                                controller: phoneController,
                                enabled: true,
                                canGoNext: true,
                                isNumber: true),
                            Spaces.smallTopSpace,
                            LabeledField(
                                label: 'Enter Amount',
                                hint: '500',
                                controller: amountController,
                                isNumber: true,
                                enabled: true),
                          ],
                        ),
                      )),
                  AltGreenButton(
                      tapped: ()async{
                        Fluttertoast.cancel();
                        if(phoneController.text.isEmpty){
                          Fluttertoast.showToast(msg: "Enter a phone number");
                        }else if(phoneController.text.trim().length!=10){
                          Fluttertoast.showToast(msg: "Enter a valid 10 digit phone number");
                        }else if(amountController.text.isEmpty){
                          Fluttertoast.showToast(msg: "Enter an amount");
                        }else{
                          // pledge obj to send
                          final request=PledgePaymentRequest(
                              amount: double.parse(amountController.text),
                              paymentMethod: fundraiserProvider.selectedPledgeMethod!.method);
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
