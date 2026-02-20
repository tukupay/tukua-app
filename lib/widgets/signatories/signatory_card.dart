import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/routes.dart';
class SignatoryCard extends StatelessWidget {
  final int index;
  const SignatoryCard({super.key,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Navigator.pushNamed(context, Routes.signatoryInfo);
      },
      child: Container(
        width: size.width,
        color:  index%5==0? HexColor(AppColors.lightFadedGreen)
            : index%2==0?HexColor(AppColors.fadedOrange)
            :Colors.white,
        padding: Paddings.tinyVertical,
        child: Row(
          children: [
            Row(
              children: [
                Text('${index+1}. '),
                Container(
                  height: 45,width: 45,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                      image: DecorationImage(
                          image: AssetImage(Strings.imageAsset('user.jpeg')),
                          fit: BoxFit.cover)
                  ),
                ),
                Spaces.smallSideSpace,
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Julius Moraa',style: Blacks.tinyBolderPoppins),
                    Text('0785760241',style: Blacks.smallestBoldPoppins),
                    Text('julius@gmail.com',style: Greens.tinyInter)
                  ],
                )
              ],
            ),
            Spacer(),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('VIEW',style: Greens.smallBoldInter,),
                Text('31/07/2025 3:03 am',style: Blacks.tinySemiJakarta)
              ],
            )
          ],
        ),
      ),
    );
  }
}
