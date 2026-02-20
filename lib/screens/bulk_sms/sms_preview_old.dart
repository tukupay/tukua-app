import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../widgets/widget.dart';
import '../../constants/constants.dart';
class SmsPreview extends StatelessWidget {
  const SmsPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text('Summary',style: Blacks.mediumSemiRubik),
        actions: [
          IconButton(
              onPressed: (){
                Navigator.pushNamed(context, Routes.smsHistory);
              }, icon: Icon(Icons.history))
        ],
      ),
      body: PopScope(
        onPopInvokedWithResult: (bool b,res){
          Provider.of<BulkSmsProvider>(context,listen: false).resetRecipientCount();
        },
        child: Consumer6<ProfileProvider,SenderIdsProvider,BulkSmsProvider,CreditsProvider,SmsProvider,PaymentsProvider>(
          builder: (_,profileProvider,senderIdsProvider,bulkSmsProvider,creditProvider,smsProvider,payments,__) {
            return Container(
              padding: Paddings.smallAllSides,
              child: Flex(
                  direction: Axis.vertical,
              children: [
                Expanded(
                    child: SizedBox(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SmsOverview(),
                            Spaces.smallTopSpace,
                            Divider(),
                            Spaces.smallTopSpace,
                            Text('Sender Info',style: Greens.mediumSemiInter),
                            Spaces.smallTopSpace,
                            profileProvider.user?.type==Strings.individualAcc?
                            smsDetail('Name', '${profileProvider.user?.firstName} ${profileProvider.user?.lastName??profileProvider.user?.middleName}'):
                                smsDetail("Name", profileProvider.user?.businessName??'Not Found'),
                            smsDetail('Phone', profileProvider.user?.phoneNumber??'User Phone'),
                            Spaces.smallTopSpace,
                            Divider(),
                            Spaces.smallTopSpace,
                            Text('Recipients',style: Greens.mediumSemiInter),
                            Spaces.smallTopSpace,
                            bulkSmsProvider.selectedGroups.isNotEmpty?
                            smsDetail("Groups", bulkSmsProvider.selectedGroups.length.toString()):
                            bulkSmsProvider.selectedContacts.isNotEmpty?
                            smsDetail("Contacts", bulkSmsProvider.selectedContacts.length.toString()):
                            const SizedBox(),
                            Spaces.smallTopSpace,
                            Divider(),
                            Spaces.smallTopSpace,
                            Text('Sms Credits & Cost',style: Greens.mediumSemiInter),
                            Spaces.smallTopSpace,
                            creditProvider.creditBalance?.smsBalance==null||creditProvider.creditBalance!.smsBalance==0?
                                smsDetail('Available credit ${creditProvider.creditBalance!.smsBalance??0}', "Top Up Now",
                                tapped: (){
                                  Provider.of<PaymentsProvider>(context,listen: false).selectType(payments.transactionTypes.firstWhere((el)=>el.type==Strings.smsCreditsPurchase));
                                  Navigator.pushNamed(context, Routes.smsTopUp);
                                }):
                           Column(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                               smsDetail("Balance", "${creditProvider.creditBalance?.smsBalance??0} SMS"),
                               smsDetail("Cost", "${bulkSmsProvider.recipientCount} SMS"),
                               smsDetail("Remaining", "${creditProvider.creditBalance!.smsBalance!-bulkSmsProvider.recipientCount}")
                             ])
                          ],
                        ),
                      ),
                    )),
                Row(
                  children: [
                    Flexible(
                      child: AuthButton(
                          color: AppColors.primaryOrange,
                          text: "Edit",
                          tapped: (){
                            Navigator.pop(context);
                          }),
                    ),
                    Spaces.smallSideSpace,
                    Flexible(
                      child: AuthButton(
                          tapped: ()async{
                            showAdaptiveDialog(
                              context: context,
                              builder: (context)=>AiAnalysisAlert(
                                icon: HugeIcons.strokeRoundedUserGroup,
                                action: "Sending Bulk Message",
                              )
                            );
                            // if selectedGroups not empty, send to groups
                            if(bulkSmsProvider.selectedGroups.isNotEmpty){
                              final sms=GroupSmsRequest(
                                  groupId: bulkSmsProvider.selectedGroups[0].id!,
                                  message: bulkSmsProvider.newSms!.message,
                                senderId: bulkSmsProvider.selectedSenderId);
                              await smsProvider.sendSmsToGroup(sms);
                              Navigator.pop(context);
                              if(smsProvider.smsResponse?.error==null){
                                bulkSmsProvider.resetRecipients();
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
                                          child: TopUpAlert(
                                              title: smsProvider.groupSmsResponse?.message??'Message queued',
                                              tapped: (){
                                                Navigator.pop(context);
                                                Navigator.pop(context);
                                              }));
                                    }
                                );
                              }
                              // if selectedContacts not empty, send to contacts
                            }else if(bulkSmsProvider.selectedContacts.isNotEmpty){
                              final sms=SmsRequest(
                                phoneNumbers: bulkSmsProvider.selectedContacts.map((c)=>c.phoneNumber!).toList(),
                                message: bulkSmsProvider.newSms!.message,
                                senderId: bulkSmsProvider.selectedSenderId,
                              );
                              await smsProvider.sendSms(sms);
                              Navigator.pop(context);
                              if(smsProvider.smsResponse?.error==null){
                                bulkSmsProvider.resetRecipients();
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
                                          child: TopUpAlert(
                                              title: smsProvider.groupSmsResponse?.message??'Message queued',
                                              tapped: (){
                                                Navigator.pop(context);
                                                Navigator.pop(context);
                                              }));
                                    }
                                );
                              }
                            }
                          },
                          text: "Confirm & Send"),
                    ),
                  ],
                ),
              ],
              ),
            );
          }
        ),
      )
    );
  }
}

Widget smsDetail(String title,String detail, {void Function()? tapped}){
  return Flex(
    direction: Axis.horizontal,
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('$title : ',style: Grays.regularPoppins),
      Spaces.tinySideSpace,
      Expanded(
        child: GestureDetector(
            onTap: tapped,
            child: Text(detail,style: Blacks.regularSemiRoboto)),
      )
    ],
  );
}
