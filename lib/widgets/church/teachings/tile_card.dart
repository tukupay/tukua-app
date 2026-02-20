import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/routes.dart';
import '../../../constants/constants.dart';

class TileCard extends StatelessWidget {
  const TileCard({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Navigator.pushNamed(context, Routes.videosQueue);
      },
      child: Container(
        margin: Paddings.tinyVertical,
        child: Row(
          children: [
            Container(
              height: 58,width: 58,
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(85),
                  image: DecorationImage(
                      image: AssetImage(Strings.sampleImageAsset("adobe.jpg")),
                      fit: BoxFit.cover),
                  boxShadow: [
                    BoxShadow(
                        offset: const Offset(0, 4),
                        blurRadius: 4,
                        spreadRadius: 0,
                        color: Colors.black.withOpacity(.25)
                    )
                  ]
              ),
            ),
            Spaces.smallSideSpace,
            Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Title',
                        style: Blacks.regularKarla),
                    Text('Author',
                        style: Grays.tinyPoppinsHint),
                    Spaces.tinyTopSpace,
                    Container(
                      alignment: Alignment.center,
                      height: 20,width: 60,
                      decoration: BoxDecoration(
                          color: HexColor('716868'),
                          borderRadius: BorderRadius.circular(4)
                      ),
                      child: Text("02:47",
                          style: Whites.smallSemiInter),
                    )
                  ],
                )),
            Container(
              height: 48,width: 48,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: HexColor('716868')
              ),
              child: const Icon(Icons.play_arrow_rounded,
                color: Colors.white,size: 26,),
            )
          ],
        ),
      ),
    );
  }
}
