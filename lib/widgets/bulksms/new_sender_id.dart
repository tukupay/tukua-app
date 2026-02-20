import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import '../../models/models.dart';
import '../widget.dart';
import '../../constants/constants.dart';
class NewSenderId extends StatefulWidget {
  final TextEditingController senderIdController;
  final TextEditingController reasonController;
  final void Function(void Function()) setSheetState;
  const NewSenderId({super.key,
  required this.senderIdController,
  required this.reasonController,
  required this.setSheetState});

  @override
  State<NewSenderId> createState() => _NewSenderIdState();
}

class _NewSenderIdState extends State<NewSenderId> {
  @override
  Widget build(BuildContext context) {
    return Consumer<SenderIdsProvider>(
      builder: (_,senderIdsProvider,__) {
        return SizedBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              senderIdsProvider.suggestedIds.isEmpty?
              Text('Ids you enter will appear here',style: Grays.smallestPoppinsHint):
              // sender ids to submit
              SizedBox(
                child: Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    direction: Axis.horizontal,
                    children: senderIdsProvider.suggestedIds
                        .map((s)=>Container(
                      padding: Paddings.smallestAllSides,
                      decoration: BoxDecoration(
                          color: HexColor(AppColors.lightestGray),
                          borderRadius: BorderRadius.circular(14)
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(s),
                          GestureDetector(
                            child: Icon(Icons.close,color: HexColor(AppColors.red)),
                            onTap: (){
                              senderIdsProvider.removeSuggestedID(s);
                              widget.setSheetState(() {});
                            },
                          )
                        ],
                      ),
                    )).toList()
                ),
              ),
              Spaces.smallTopSpace,
              // sender id text input & add button
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Flexible(
                    flex:3,
                    child: LabeledField(
                        label: 'Sender Id',
                        hint: 'eg TUKU',
                        controller: widget.senderIdController,
                        enabled: true),
                  ),
                  Spaces.smallSideSpace,
                  Flexible(
                    flex: 1,
                    child: AltGreenButton(
                        tapped: (){
                          widget.senderIdController.text.trim();
                          if(widget.senderIdController.text.length>=3&&widget.senderIdController.text.length<=20&&regex.hasMatch(widget.senderIdController.text)){
                            senderIdsProvider.addSuggestedID(widget.senderIdController.text.trim().toUpperCase());
                            widget.senderIdController.clear();
                            widget.setSheetState(() {});
                          }else if(senderIdsProvider.suggestedIds.length==5){
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(msg: '5 requests will do just fine');
                          }else{
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(msg: 'Ensure your sender id meets our criteria');
                          }
                        },
                        text: 'Add'),
                  )
                ],
              ),
              Spaces.tinyTopSpace,
              Wrap(
                children: [
                  Text('* 3 - 20 characters.',style: Grays.tinyPoppinsHint),
                  Text('* Letters and numbers only',style: Grays.tinyPoppinsHint),
                  Text('* No spaces or special characters',style: Grays.tinyPoppinsHint),
                ],
              ),
              Spaces.smallTopSpace,
              LabeledField(
                // multiLine: true,
                  label: 'Reason',
                  hint: 'eg To communicate with team members',
                  enabled: true,
                  controller: widget.reasonController),
              Spaces.smallTopSpace,
              Center(
                child:  senderIdsProvider.requestingSenderId?
                RotatingDots() : AltGreenButton(
                    tapped: ()async{
                      if(senderIdsProvider.suggestedIds.length<5){
                        Fluttertoast.cancel();
                        Fluttertoast.showToast(msg: 'Enter at least 5 sender Ids');
                      }else{
                        widget.setSheetState((){});
                        await senderIdsProvider.requestSenderId(
                            SenderIdRequest(
                                requestedSenderIds: senderIdsProvider.suggestedIds,
                                reason: widget.reasonController.text.isNotEmpty?widget.reasonController.text:null
                            )
                        );
                        Navigator.pop(context);
                        widget.setSheetState((){});
                      }
                    },
                    text: "REQUEST A SENDER ID"),
              )
            ],
          ),
        );
      }
    );
  }
}
