import 'package:custom_rating_bar/custom_rating_bar.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';
class MyChurchCard extends StatelessWidget {
  const MyChurchCard({super.key});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: (){
        Navigator.pushNamed(context, Routes.myChurch);
      },
      child: Material(
        elevation: 4,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: 268,
          width: 320,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
                color: HexColor('EFE9E9'),
                width: 1
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  Container(
                    height: 178,width: 320,
                    decoration: BoxDecoration(
                        image: DecorationImage(
                            image: AssetImage(Strings.sampleImageAsset("alamano.jpg")),
                            fit: BoxFit.cover),
                        borderRadius: BorderRadius.circular(14.5)
                    ),
                  ),
                  Padding(
                    padding: Paddings.tinyAllSides,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          alignment: Alignment.center,
                          height: 29,
                          width: 117,
                          decoration: BoxDecoration(
                              color: HexColor('E85D1C'),
                              borderRadius: BorderRadius.circular(14.5)
                          ),
                          child: Text('My Church',
                              style: Whites.regularSemiRoboto),
                        ),
                        Container(
                          height: 29,
                          width: 89,
                          decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14.5)
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              const RatingBar.readOnly(
                                alignment: Alignment.center,
                                filledIcon: Icons.church,
                                emptyIcon: Icons.church,
                                halfFilledIcon: Icons.church,
                                halfFilledColor: Colors.grey,
                                size: 9,
                                isHalfAllowed: true,
                                initialRating: 4.5,
                                maxRating: 5,
                              ),
                              Text('4.5',style: Blacks.smallestBoldPoppins)
                            ],
                          ),
                        )
                      ],
                    ),
                  )
                ],
              ),
              Container(
                  padding: Paddings.smallHorizontal,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Spaces.tinyTopSpace,
                      Text('Jubilee Christian Church',style: Blacks.tinyBoldGrotesk,
                          overflow: TextOverflow.ellipsis),
                      Text("Pastor Morris Gacheru",style: Blacks.tinyBolderPoppins),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('View Church',style: Greens.smallBoldInter),
                          // TinyMembersStacked(total: myChurch.members)
                        ],
                      )
                    ],
                  ))
            ],
          ),
        ),
      ),
    );
  }
}