import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';

class OfferingType extends StatefulWidget {
  final int index;
  const OfferingType({super.key,
  required this.index});

  @override
  State<OfferingType> createState() => _OfferingTypeState();
}

class _OfferingTypeState extends State<OfferingType> {

  final amountController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      padding: Paddings.smallestAllSides,
      margin: Paddings.smallestVertical,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
          color: widget.index%2==0? Colors.white:HexColor('#FFFEF4'),
          boxShadow: [
            BoxShadow(
                offset: Offset(0, 1),
                blurRadius: 4,
                spreadRadius: 0,
                color: Colors.black.withAlpha(50),
                blurStyle: BlurStyle.outer
            )
          ]
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text("${widget.index+1}. ",style: Blacks.regularSemiCairo),
              Spaces.smallSideSpace,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Offering Type",style: Blacks.regularSemiCairo),
                    Spaces.tinyTopSpace,
                    Text("Routine giving to empower ministry and maintain church services, Routine giving to empower ministry and maintain services",
                        style: Blacks.smallCairo)
                  ],
                ),
              )
            ],
          ),
          Spaces.tinyTopSpace,
          Container(
            width: size.width,
            height: 0.5,
            color: HexColor(AppColors.lightGray),
          ),
          Container(
            // height:60,
            width: size.width,
            child: Row(
              children: [
                Spaces.smallSideSpace,
                Container(
                  height:50,
                  width:50,
                  decoration: BoxDecoration(
                      image: DecorationImage(
                          image: AssetImage(Strings.sampleImageAsset("offering.png")),
                          fit: BoxFit.cover
                      )
                  ),
                ),
                Spaces.smallSideSpace,
                Container(
                  height: 100,width: 0.5,
                  color: HexColor(AppColors.lightGray)),
                Spaces.smallSideSpace,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Spaces.tinyTopSpace,
                      _offeringPayment("Paybill Number", "200300"),
                      _offeringPayment("Account Number", "402304"),
                      Spaces.smallTopSpace,
                      AltGreenButton(
                          tapped: (){
                            showAdaptiveDialog(
                                context: context,
                                builder: (amtContext)=>InputAmountAlert(
                                    amountController: amountController,
                                    tapped: (){
                                      Fluttertoast.cancel();
                                      if(amountController.text.isEmpty){
                                        Fluttertoast.showToast(msg: "Please enter amount");
                                      }else{
                                        Navigator.pop(context);
                                        Navigator.pushNamed(context, Routes.transactionOtp);
                                      }
                                    }));
                          },
                          text: "Give"),
                      Spaces.tinyTopSpace
                    ],
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}

Widget _offeringPayment(String title,String account){
  return Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    mainAxisAlignment: MainAxisAlignment.start,
    children: [
      Text('$title : ',style: Grays.smallGrotesk),
      Text(account,style: Blacks.smallestBolderPoppins,),
      Spaces.tinySideSpace,
      GestureDetector(
        onTap: ()async{
          Fluttertoast.cancel();
          await Clipboard.setData(ClipboardData(text: account));
          Fluttertoast.showToast(msg: "Copied $title to clipboard");
        },
        child: Icon(Icons.copy,size: 16),
      )
    ],
  );
}

