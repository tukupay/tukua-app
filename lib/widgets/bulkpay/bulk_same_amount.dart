import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';

import '../../providers/providers.dart';
class BulkSameAmount extends StatefulWidget {
  
  const BulkSameAmount({super.key});

  @override
  State<BulkSameAmount> createState() => _BulkSameAmountState();
}

class _BulkSameAmountState extends State<BulkSameAmount> {
  final totalAmountController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer2<BulkPayProvider,DeviceContactProvider>(
      builder: (_,bulkPay,deviceContactProvider,__) {
        return deviceContactProvider.filteredContacts.isEmpty &&
              (bulkPay.groupContacts==null||
              bulkPay.groupContacts!.contacts!.isEmpty)?const SizedBox():
          Container(
          margin: EdgeInsets.only(top: 16),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: HexColor(AppColors.lightGray))
            )
          ),
          width: size.width,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // SAME AMOUNT OPTION
                  SizedBox(
                    width: size.width/2,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Text('Same Amount for all',style: Blacks.tinyBoldJakarta),
                        Radio<bool>(
                            visualDensity: VisualDensity.compact,
                            toggleable: true,
                            value: true,
                            groupValue: bulkPay.sameAmount,
                            activeColor: HexColor(AppColors.primaryOrange),
                            onChanged: (val){
                              Provider.of<BulkPayProvider>(context,listen: false).setSameAmount(val??false);
                              totalAmountController.clear();
                            }),
                      ],
                    ),
                  ),
                      // SAME AMOUNT FIELD
                      GestureDetector(
                        onTap: (){
                          if(bulkPay.sameAmount==true && bulkPay.selectedContacts.isEmpty){
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(msg: "Please select your recipients first");
                          }
                        },
                        child: SizedBox(
                            height: 35,
                            width: size.width/3,
                            child: TextFormField(
                              controller: totalAmountController,
                              maxLines: 1,
                              enabled: bulkPay.sameAmount==true?bulkPay.selectedContacts.isNotEmpty:false,
                              onChanged: (val) {
                                final amount = int.tryParse(val) ?? 0;
                                Provider.of<BulkPayProvider>(context,
                                    listen: false)
                                    .setAmount(null, amount);
                              },
                              textAlign: TextAlign.center,
                              textInputAction: TextInputAction.done,
                              keyboardType: TextInputType.number,
                              style: Blacks.regularKarla,
                              cursorHeight: 15,
                              cursorColor: HexColor('#15411D'),
                              decoration: InputDecoration(
                                  hintText: 'ksh amount',
                                  hintStyle: Grays.tinySemiKarla,
                                  enabledBorder: OutlineInputBorder(),
                                  border: OutlineInputBorder(),
                                  focusedBorder: OutlineInputBorder(
                                      borderSide: BorderSide(color: HexColor('#15411D'))
                                  ),
                                  errorBorder: OutlineInputBorder(
                                      borderSide: BorderSide(color: Colors.redAccent)
                                  )
                              ),
                            )),
                      ),
                ],
              ),
              Spaces.smallTopSpace
            ],
          ),
        );
      }
    );
  }
}
