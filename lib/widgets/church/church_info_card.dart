import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class ChurchInfoCard extends StatelessWidget {
  const ChurchInfoCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        image: DecorationImage(
            image: AssetImage(Strings.sampleImageAsset("alamano.jpg")),
        fit: BoxFit.cover)
      ),
      child: Container(
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
          color: HexColor(AppColors.fadedGreen).withAlpha(200)
        ),
        child: Padding(
          padding: Paddings.tinyAllSides,
          child: Row(
            children: [
              Container(
                height: 95,
                width: 117,
                padding: Paddings.smallestVertical,
                alignment: Alignment.topCenter,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: HexColor(AppColors.lightGray),
                  image: DecorationImage(
                      image: AssetImage(Strings.sampleImageAsset("alamano.jpg")),
                  fit: BoxFit.cover)),
                child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8)
                    ),
                    padding: Paddings.tinyHorizontal,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text("Joined",style: Greens.smallBoldInter),
                        Spaces.tinySideSpace,
                        Icon(Icons.check_box,color: HexColor(AppColors.primaryGreen),size: 18)
                      ],
                    )),
              ),
              Spaces.smallSideSpace,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Jubilee Christian Church",style: Whites.regularSemiRoboto),
                    Text("Thika Road, Nairobi",style: Whites.smallBoldRoboto),
                    Spaces.tinyTopSpace,
                    Text("About Us",style: Whites.smallestRoboto),
                    Green(),
                    Text("Welcome to Jubilee Christian Church Thika Road, a vibrant and inclusive community of believers dedicated to worship, fellowship, and service.",
                    style: Whites.smallestRoboto),
                    Spaces.tinyTopSpace

                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
