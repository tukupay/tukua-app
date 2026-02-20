import 'package:flutter/material.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
class AllBills extends StatelessWidget {
  const AllBills({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SizedBox(
        child: ListView.builder(
            itemCount: myBills.length,
            shrinkWrap: true,
            padding: Paddings.tinyAllSides,
            itemBuilder: (context,index){
              Bill bill=myBills[index];
              return BillCard(bill: bill, index: index);
            }),
      )
    );
  }
}
