import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import '../../providers/providers.dart';

class Groups extends StatelessWidget {
  const Groups({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      padding: Paddings.tinyAllSides,
      width: size.width,
      child: Consumer2<BulkPayProvider,ContactsProvider>(
        builder: (_,bulkPay,contactsProvider,__) {
          return Wrap(
            alignment: WrapAlignment.start,
            spacing: 4,
              runSpacing: 4,
          children: contactsProvider.groups.map((group){
            bool isSelected=bulkPay.selectedGroup?.id==group.id;
            return GestureDetector(
              onTap: (){
                Provider.of<BulkPayProvider>(context,listen: false).selectGroup(group);
              },
              child: Container(
                padding: Paddings.tinyAllSides,
                decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    color: HexColor(isSelected?
                    AppColors.primaryGreen:
                    AppColors.lightestGray)
                ),
                child: Text(group.name!,
                  style: TextStyle(
                      color: isSelected ?Colors.white:Colors.black
                  )),
              ),
            );
          }).toList());
        }
      )
    );
  }
}
