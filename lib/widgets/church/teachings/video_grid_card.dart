import 'package:blurrycontainer/blurrycontainer.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/routes.dart';
import '../../../constants/constants.dart';

class VideoGridCard extends StatelessWidget {
  const VideoGridCard({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Navigator.pushNamed(context, Routes.videosQueue);
      },
      child: Container(
        height: 185,
        width: 160,
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                  offset: const Offset(0, 8),
                  blurRadius: 8,
                  spreadRadius: 0,
                  color: HexColor('8163D6').withOpacity(.15)
              )
            ]
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: size.width,
              height: 120,
              decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16)
                  ),
                  image: DecorationImage(
                      image: AssetImage(Strings.sampleImageAsset("adobe.jpg")),
                      fit: BoxFit.cover)
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  BlurryContainer(
                      height:56,width: 56,
                      borderRadius: BorderRadius.circular(64),
                      child: const Center(
                        child: Icon(Icons.play_arrow_rounded,
                            color: Colors.white,
                            size: 20),
                      )),
                  Positioned(
                      bottom: 8,
                      right: 2,
                      child: Container(
                        alignment: Alignment.center,
                        height: 20,
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(4)
                        ),
                        child: Text("02:47",
                            style: Blacks.tinyBolderPoppins),
                      ))
                ],
              ),
            ),
            Padding(
                padding: Paddings.tinyAllSides,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Video title",style: Blacks.smallestBolderPoppins,
                    overflow: TextOverflow.ellipsis),
                Spaces.tinyTopSpace,
                Text("Author",style: Blacks.tinyBolderPoppins,
                    overflow: TextOverflow.ellipsis)
              ],
            ))
          ],
        ),
      ),
    );
  }
}
