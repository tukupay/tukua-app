import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../../widgets/widget.dart';
class ActiveSenderIds extends StatelessWidget {
  const ActiveSenderIds({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: Container(
        padding: Paddings.smallAllSides,
        child: Consumer<SenderIdsProvider>(
            builder: (_,senderIdsProvider,__){
              return senderIdsProvider.loadingSenderIds||
              senderIdsProvider.senderIds?.userSenderIds==null?
                  const CircularProgressIndicator():
                      SingleChildScrollView(
                        primary: true,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            senderIdsProvider.senderIds!.userSenderIds!.isEmpty?
                            emptySenderIds(context,size):
                            ListView.builder(
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: senderIdsProvider.senderIds!.userSenderIds!.length,
                                shrinkWrap: true,
                                itemBuilder: (context,index){
                                ActualSenderId senderId=senderIdsProvider.senderIds!.userSenderIds![index];
                                return SenderIdCard(senderId: senderId);
                                }),
                            Spaces.smallTopSpace,
                            Divider(),
                            Spaces.smallTopSpace,
                            Text('System Sender IDs',style: Blacks.mediumSemiRubik),
                            Spaces.smallTopSpace,
                            ListView.builder(
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: senderIdsProvider.senderIds!.systemSenderIds!.length,
                              shrinkWrap: true,
                              itemBuilder: (context,index) {
                                String senderId = senderIdsProvider.senderIds!
                                    .systemSenderIds![index];
                                return Container(
                                  padding: Paddings.smallAllSides,
                                  decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: HexColor(AppColors.lightGray),
                                      )
                                  ),
                                  margin: Paddings.tinyVertical,
                                  child: Text(
                                      senderId, style: Blacks.regularSemiRoboto),
                                );
                              })
                          ],
                        ),
                      );

            }),
      ),
    );
  }
}

Widget emptySenderIds(BuildContext context,Size size){
  final senderIdController=TextEditingController();
  final reasonController=TextEditingController();
  return SizedBox(
    width: size.width,
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Spaces.mediumTopSpace,
        Icon(HugeIcons.strokeRoundedMessageCancel01,size: 45,
            color: HexColor(AppColors.lightGray)),
        Spaces.smallTopSpace,
        Text('No sender Ids found',style: Grays.regularSemiInter),
        Spaces.smallTopSpace,
        GestureDetector(
          onTap: (){
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
          },
            child: Text('Request a new one',style: Greens.smallBoldInter)),
      ],
    ),
  );
}
