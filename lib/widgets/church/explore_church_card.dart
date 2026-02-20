import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';
class ExploreChurchCard extends StatelessWidget {
  final int index;
  const ExploreChurchCard({super.key,
    required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Provider.of<ChurchProvider>(context,listen: false).selectChurch();
        Navigator.pushNamed(context, Routes.churchInfo);
      },
      child: Container(
        alignment: Alignment.center,
        margin: Paddings.tinyVertical,
        padding: Paddings.smallHorizontal,
        height: 48,
        width: size.width,
        decoration: BoxDecoration(
            color: index%2==0?Colors.transparent:HexColor('F3FFF1'),
            border: Border.all(color: HexColor('9C9C9C')),
            borderRadius: BorderRadius.circular(8)
        ),
        child: Row(
          children: [
            Text('${index+1}.',style: Blacks.tinyRubik),
            Spaces.tinySideSpace,
            Container(
              height: 30,width: 30,
              decoration: BoxDecoration(
                  image: DecorationImage(
                      image: AssetImage(Strings.sampleImageAsset('church.jpg')),
                      fit: BoxFit.cover),
                  borderRadius: BorderRadius.circular(10)
              ),
            ),
            Spaces.smallSideSpace,
            Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("JCC Thika Road",style: Blacks.tinyBoldJakarta),
                    Text("Rev. Morris Gacheru",style: Blacks.tinyRubik)
                  ],
                )),
            GestureDetector(
              onTap: (){
                Fluttertoast.showToast(msg: "TO CHURCH INFO");
              },
              child: Text('View',style: Greens.tinySemiRoboto),
            ),
          ],
        ),
      ),
    );
  }
}
