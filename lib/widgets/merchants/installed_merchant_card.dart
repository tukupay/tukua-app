import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';

/// Card showing an installed merchant mini-app
class InstalledMerchantCard extends StatelessWidget {
  const InstalledMerchantCard({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, Routes.myChurch);
      },
      child: Material(
        elevation: 4,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: 268,
          width: size.width,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: HexColor('EFE9E9'),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  // Cover image
                  Container(
                    height: 178,
                    width: size.width,
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        image: AssetImage(Strings.sampleImageAsset("qoir.webp")),
                        fit: BoxFit.cover,
                      ),
                      borderRadius: BorderRadius.circular(14.5),
                    ),
                  ),
                  // Status badges
                  Padding(
                    padding: Paddings.tinyAllSides,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Installed badge
                        Container(
                          alignment: Alignment.center,
                          height: 29,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                HexColor(AppColors.primaryGreen),
                                HexColor(AppColors.fadedGreen),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(14.5),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.check_circle,
                                color: Colors.white,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Installed',
                                style: Whites.regularSemiRoboto.copyWith(fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        // Category badge
                        Container(
                          height: 29,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14.5),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                HugeIcons.strokeRoundedStore04,
                                size: 14,
                                color: HexColor(AppColors.primaryGreen),
                              ),
                              const SizedBox(width: 6),
                              Text('Faith', style: Blacks.smallestBoldPoppins),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Details section
              Container(
                padding: Paddings.smallHorizontal,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Spaces.tinyTopSpace,
                    Text(
                      'JCC Thika Road',
                      style: Blacks.tinyBoldGrotesk,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      "Our church is located along Thika Road",
                      style: Grays.smallRoboto,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Spaces.tinyTopSpace,
                    Row(
                      children: [
                        Icon(
                          HugeIcons.strokeRoundedCheckmarkCircle02,
                          color: HexColor(AppColors.primaryGreen),
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Active',
                          style: Greens.tinySemiRoboto,
                        ),
                        const Spacer(),
                        Text(
                          'Tap to open',
                          style: Grays.tinySemiKarla,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

