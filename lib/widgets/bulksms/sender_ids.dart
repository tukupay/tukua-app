import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
class SenderIds extends StatefulWidget {
  const SenderIds({super.key});

  @override
  State<SenderIds> createState() => _SenderIdsState();
}

class _SenderIdsState extends State<SenderIds> {
  final senderIdController=TextEditingController();
  final reasonController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Consumer<SenderIdsProvider>(
      builder: (_,senderIdsProvider,__) {
        return Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('Sender ID', style: Blacks.regularBoldCodeNext),
                GestureDetector(
                    onTap: () {
                     Navigator.pushNamed(context, Routes.smsSenderIds);
                    },
                    child: Text('View All', style: Greens.smallBoldInter))
              ],
            ),
            Spaces.smallTopSpace,
            Text("Sender IDs are the names or numbers that appear on the recipient's phone when they receive your messages. You can add new sender IDs to your account.",
            style: Blacks.tinyRoboto),
            Spaces.smallTopSpace,
            SmsNewButton(
                text: 'Add New Sender ID',
                tapped: (){
                  showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      scrollControlDisabledMaxHeightRatio: 1/1,
                      builder: (sheetContext){
                        return StatefulBuilder(
                          builder: (context,setSheetState) {
                            return Padding(
                              padding: EdgeInsets.only(
                                bottom: MediaQuery.of(context).viewInsets.bottom
                              ),
                              child: PlainSheet(
                                  height: 450,
                                  title: 'Request for a sender ID',
                                  subTitle: 'This will appear in messages you send to others',
                                  body: NewSenderId(
                                    senderIdController: senderIdController,
                                    reasonController: reasonController,
                                    setSheetState: setSheetState,
                                  )),
                            );
                          }
                        );
                      });
                })
          ],
        );
      }
    );
  }
}
RegExp regex = RegExp(r"^[a-zA-Z0-9]{3,20}$");
