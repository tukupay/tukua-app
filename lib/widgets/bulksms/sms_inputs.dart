import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class SmsInputs extends StatefulWidget {
  final TextEditingController body;
  const SmsInputs({super.key,
  required this.body});

  @override
  State<SmsInputs> createState() => _SmsInputsState();
}

class _SmsInputsState extends State<SmsInputs> {
  bool includeLink=false;
  @override
  Widget build(BuildContext context) {
    return Consumer2<BulkSmsProvider,SenderIdsProvider>(
      builder: (_,bulkSms,senderIdsProvider,__) {
        return SizedBox(
          child: Column(
            children: [
                  Column(
                    crossAxisAlignment:  CrossAxisAlignment.start,
                    children: [
                      senderIdsProvider.loadingSenderIds||senderIdsProvider.senderIds==null?
                          Center(child: WaveDots()):
                      // build a safe list of menu items, appending "Phone" and "Local"
                      Builder(builder: (ctx) {
                        final userIds = senderIdsProvider.senderIds!.userSenderIds?.map((id)=>id.senderId).toList() ?? [];
                        final systemIds = senderIdsProvider.senderIds!.systemSenderIds ?? [];

                        // choose base list: prefer userIds, fallback to systemIds
                        final List<String> base = userIds.isNotEmpty ? List.from(userIds) : (systemIds.isNotEmpty ? List.from(systemIds) : ["None Found"]);

                        // append special options for sending via device (local) or phone SMS
                        const specialOpts = [Strings.localSenderId];
                        for (final opt in specialOpts) {
                          if (!base.contains(opt)) base.add(opt);
                        }

                        return SimpleSelectorCard<String>(
                          selectedItem: bulkSms.selectedSenderId,
                          items: base,
                          onSelected: (val) {
                            if(val=="None Found") return;
                            Provider.of<BulkSmsProvider>(context,listen: false).selectSenderId(val);
                          },
                          itemLabelBuilder: (item) => item,
                          label: 'Sender ID',
                          sheetTitle: 'Select Sender ID',
                          sheetSubtitle: 'Choose who the SMS will be sent from',
                          icon: HugeIcons.strokeRoundedSent,
                        );
                      })
                    ],
                  ),
              Spaces.smallTopSpace,
              LabeledField(
                controller: widget.body,
                multiLine: true,
                  label: 'Message Body',
                  hint: "Enter your message here...",
                  enabled: true),
              Spaces.smallTopSpace,
              Row(
                children: [
                  Text("Include Payment Link",style: Blacks.smallestBolderPoppins),
                  Spaces.tinySideSpace,
                  SizedBox(
                    height: 15,
                    child: Switch(
                      activeThumbColor: HexColor(AppColors.primaryGreen),
                        value: bulkSms.includePaymentLink,
                        onChanged: (val){
                          debugPrint("UPDATED TO $val");
                          Provider.of<BulkSmsProvider>(context,listen: false).updateIncludePaymentLink(val);
                        }),
                  )
                ],
              ),
              Spaces.smallTopSpace,
              bulkSms.includePaymentLink?
              PaymentLinkCreation():
              const SizedBox(),
              bulkSms.includePaymentLink?
              Spaces.smallTopSpace:const SizedBox(),
            ],
          )
        );
      }
    );
  }
}
