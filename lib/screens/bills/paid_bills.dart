import 'package:flutter/material.dart';
import 'package:tuku/models/models.dart';

import '../../constants/constants.dart';
import '../../widgets/widget.dart';
class PaidBills extends StatelessWidget {
  const PaidBills({super.key});

  @override
  Widget build(BuildContext context) {
    List<Bill> paidBills=myBills.where(
            (element)=>element.status==Strings.paidStatus).toList();
    return Scaffold(
        backgroundColor: Colors.transparent,
        body: SizedBox(
          child: ListView.builder(
              itemCount: paidBills.length,
              shrinkWrap: true,
              padding: Paddings.tinyAllSides,
              itemBuilder: (context,index){
                Bill bill=paidBills[index];
                return BillCard(bill: bill, index: index);
              }),
        )
    );
  }
}
