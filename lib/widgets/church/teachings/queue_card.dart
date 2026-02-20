import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class QueueCard extends StatelessWidget {
  const QueueCard({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: 120,
      width: size.width,
      decoration: BoxDecoration(
          color: HexColor('FEFEFE'),
          boxShadow: [
            BoxShadow(
                offset: const Offset(0, 4),
                blurRadius: 8,
                spreadRadius: -1,
                color: Colors.black.withOpacity(.02)
            )
          ]
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            height: 96,width: 86,
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                image: DecorationImage(
                    image: AssetImage(Strings.sampleImageAsset("together.png")),
                    fit: BoxFit.cover)
            ),
          ),
          Spaces.smallSideSpace,
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Walking By The Spirit",
                  style: Blacks.smallestBolderPoppins),
              Spaces.smallTopSpace,
              Text("18th Oct 2025 - 10:57 am",
                  style: Grays.tinyPoppinsHint)
            ],
          )
        ],
      ),
    );
  }
}
