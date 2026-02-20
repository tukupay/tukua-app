import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';

class ProjectDisplayCard extends StatelessWidget {
  final String title;
  final String targetAmount;
  final ImageProvider coverImage;
  final String creatorName;
  final ImageProvider creatorImage;
  final String creationDate;
  final String category;
  final String progressPercentage;
  final int collectedAmount;
  final int targetAmountForProgress;
  final String shareableLink;
  final VoidCallback onTap;

  const ProjectDisplayCard({
    super.key,
    required this.title,
    required this.targetAmount,
    required this.coverImage,
    required this.creatorName,
    required this.creatorImage,
    required this.creationDate,
    required this.category,
    required this.progressPercentage,
    required this.collectedAmount,
    required this.targetAmountForProgress,
    required this.shareableLink,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: Paddings.smallVertical,
        width: size.width,
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: HexColor(AppColors.lightestGray)),
            boxShadow: [
              BoxShadow(
                  offset: const Offset(0, 2),
                  blurRadius: 2,
                  spreadRadius: 0,
                  color: Colors.black.withAlpha(80))
            ]),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 160,
              width: size.width,
              decoration: BoxDecoration(
                  image: DecorationImage(image: coverImage, fit: BoxFit.cover),
                  borderRadius: BorderRadius.circular(12)),
              child: Stack(
                children: [
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: Paddings.smallestAllSides,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(6)),
                      child: Column(
                        children: [
                          Text('Target Amount', style: Blacks.tinyRubik),
                          const YellowTwo(),
                          Text(targetAmount, style: Blacks.mediumSemiRubik),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
            Padding(
              padding: Paddings.tinyAllSides,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        height: 35,
                        width: 35,
                        decoration: BoxDecoration(
                            image: DecorationImage(
                                image: creatorImage, fit: BoxFit.cover),
                            shape: BoxShape.circle),
                      ),
                      Spaces.tinySideSpace,
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(creatorName, style: Blacks.regularSemiSans),
                          Text(creationDate, style: Blacks.regularThinSans)
                        ],
                      )
                    ],
                  ),
                  Spaces.tinyTopSpace,
                  Text(title, style: Blacks.regularSemiRoboto),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(category, style: Grays.tinyPoppinsHint),
                          Spaces.tinySideSpace,
                          Icon(Icons.check_circle,
                              color: HexColor('#036930'), size: 10)
                        ],
                      ),
                      Text(progressPercentage, style: Greens.smallBoldJakarta)
                    ],
                  ),
                  Spaces.tinyTopSpace,
                  CollectionProgress(
                      collected: collectedAmount,
                      target: targetAmountForProgress),
                  Spaces.tinyTopSpace,
                  Center(child: Text("GIVE & PLEDGE BUTTONS",style: Grays.tinySemiGrotesk))
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}