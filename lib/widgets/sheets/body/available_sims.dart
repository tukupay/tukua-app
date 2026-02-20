import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class AvailableSims extends StatelessWidget {
  final String message;
  const AvailableSims({super.key,
  required this.message});

  @override
  Widget build(BuildContext context) {
    return Consumer2<LocalSmsProvider,BulkSmsProvider>(
      builder: (_,localSms,bulkSms,__) {
        return Container(
          padding: Paddings.tinyAllSides,
          child: localSms.simCards.isEmpty?
              Column(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Spaces.mediumTopSpace,
                  Icon(Icons.sim_card_alert_outlined,color: HexColor(AppColors.primaryOrange),
                  size: 32),
                  Spaces.smallTopSpace,
                  Text("No SIM Cards found",style: Blacks.mediumSemiRubik),
                  Spaces.smallTopSpace,
                  Text("To send messages using your local sender id (phone number), we need a sim card",
                  style: Grays.tinySemiKarla,
                    textAlign: TextAlign.center,)
                ],
              )
              : Column(
            children: [
              ListView.builder(
                shrinkWrap: true,
                  padding: EdgeInsets.zero,
                  itemCount: localSms.simCards.length,
                  itemBuilder: (context,index){
                  Map<String,dynamic> sim=localSms.simCards[index];
                  return GestureDetector(
                    onTap: (){
                      localSms.selectSim(index);
                    },
                    child: Container(
                      padding: Paddings.tinyAllSides,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: HexColor(
                              localSms.selectedSimIndex==index?
                                  AppColors.primaryGreen:
                              AppColors.lightGray),
                          width: localSms.selectedSimIndex==index?2.5: 0.5
                        ),
                        borderRadius: BorderRadius.circular(8)
                      ),
                      margin: Paddings.tinyVertical,
                      child: Row(
                        children: [
                          Icon(Icons.sim_card,color: HexColor(AppColors.primaryGreen),size: 34),
                          Spaces.smallSideSpace,
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(sim['carrierName'],style: Blacks.mediumSemiRubik),
                              Text("Sim ${index+1}",style: Grays.smallRoboto)
                            ],
                          )
                        ],
                      ),
                    ),
                  );
                  }),
              Spaces.smallTopSpace,
              localSms.sending?const Center(child: WaveDots()):
              AltGreenButton(
                  tapped: ()async{
                    if(localSms.selectedSimIndex==null){
                      Fluttertoast.showToast(msg: "SIM one will be used.");
                    }
                    if(bulkSms.selectedGroups.isNotEmpty){
                      Fluttertoast.showToast(msg: "Groups are not supported yet");
                    }else{
                      await localSms.sendSms(message, bulkSms.selectedContacts.map((el)=>el.phoneNumber!).toList());
                      bulkSms.resetRecipients();
                      Navigator.pop(context);
                      Navigator.pop(context);
                    }
                  },
                  text: "Finish")
            ],
          ),
        );
      }
    );
  }
}
