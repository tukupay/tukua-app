import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class OfferingTypes extends StatelessWidget {
  const OfferingTypes({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: SizedBox(
        height: size.height,
        width: size.width,
        child: Stack(
          children: [
            DashBar(
                title: Text("Offering Types", style: Whites.mediumSemiRoboto),
            needsPop: true),
            Positioned(
                top: size.height/7,
                bottom: 0,
                child: Container(
                  height: size.height,
                  width: size.width,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    color: Colors.white
                  ),
                  child: SingleChildScrollView(
                    padding: Paddings.smallAllSides,
                    primary: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Select Your Preferred Offering Type",style: Blacks.regularBoldCodeNext),
                            Icon(HugeIcons.strokeRoundedHealtcare,color: HexColor(AppColors.primaryGreen))
                          ],
                        ),
                        Spaces.smallTopSpace,
                        Green(),
                        Spaces.smallTopSpace,
                        ListView.builder(
                          padding: EdgeInsets.zero,
                          itemCount: 5,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemBuilder: (context,index){
                              return OfferingType(index: index);
                            })
                      ]
                    ),
                  ),
                ))
          ],
        ),
      )
    );
  }
}
