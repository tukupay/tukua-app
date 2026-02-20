import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

import '../../widgets/widget.dart';
class OverdueBills extends StatelessWidget {
  const OverdueBills({super.key});

  @override
  Widget build(BuildContext context) {
    List<Bill> overdueBills=myBills.where(
            (element)=>element.status==Strings.overdueStatus).toList();
    return Scaffold(
        backgroundColor: Colors.transparent,
        body: SizedBox(
          child: ListView.builder(
              itemCount: overdueBills.length,
              shrinkWrap: true,
              padding: Paddings.tinyAllSides,
              itemBuilder: (context,index){
                Bill bill=overdueBills[index];
                return BillCard(bill: bill, index: index);
              }),
        )
    );
  }
}
