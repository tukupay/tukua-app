import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';

import '../../widgets/widget.dart';
class UpcomingBills extends StatelessWidget {
  const UpcomingBills({super.key});

  @override
  Widget build(BuildContext context) {
    List<Bill> upcomingBills=myBills.where(
            (element)=>element.status==Strings.upcomingStatus).toList();
    return Scaffold(
        backgroundColor: Colors.transparent,
        body: SizedBox(
          child: ListView.builder(
              itemCount: upcomingBills.length,
              shrinkWrap: true,
              padding: Paddings.tinyAllSides,
              itemBuilder: (context,index){
                Bill bill=upcomingBills[index];
                return BillCard(bill: bill, index: index);
              }),
        )
    );
  }
}
