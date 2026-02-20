import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';
class MyCards extends StatelessWidget {
  const MyCards({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      height: size.height,
      width: size.width,
      child: SingleChildScrollView(
        primary: true,
        padding: Paddings.smallAllSides,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('All (${dummyCards.length})',style: Blacks.tinyBolderPoppins),
            Spaces.smallTopSpace,
            ListView.separated(
              primary: false,
              shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemBuilder: (context,index){
                  CardAccount card=dummyDebitCards[index];
                  return CardAccountCard(cardAccount: card,
                  index: index);
                },
                separatorBuilder: (context,index)=>Green(),
                itemCount: dummyCards.length),
            Spaces.smallTopSpace,
            DottedButton(
              text: 'Add New Card',
              tapped: (){
                showModalBottomSheet(
                    context: context,
                    scrollControlDisabledMaxHeightRatio: 1/1,
                    builder: (context){
                      return NewAccountForm(
                        title: "Card Details",
                      );
                    });
              },
            )
          ],
        ),
      ),
    );
  }
}
