import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';

import '../../constants/constants.dart';
import '../widget.dart';
class MenuCard extends StatelessWidget {
  final String title;
  final bool isList;
  final Widget child;
  final bool hasAction;
  final void Function()? tapped;
  const MenuCard({super.key,
  required this.title,
  this.isList=false,
  required this.child,
  this.hasAction=false,
  this.tapped});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      width: size.width,
      height: isList?null: 132,
      decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
                blurRadius: 4,
                color: HexColor('26273A').withOpacity(.6),
                blurStyle: BlurStyle.outer),
          ],
          color: HexColor('E5DDDD').withOpacity(0.03),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: Colors.white,
              width: 1
          )
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding:Paddings.smallestAllSides,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title,style: Blacks.regularSemiRoboto),
                hasAction?
                GestureDetector(
                  onTap: tapped,
                  child: Container(
                      height: 25,width: 75,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: HexColor('#E0E8F2')
                        ),
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(5)
                      ),
                      child: Text('View All')),
                ):
                const SizedBox()
              ],
            ),
          ),
          const Green(),
          Spaces.tinyTopSpace,
          Container(
            alignment: Alignment.centerLeft,
            height:isList? null:85,
            width: size.width,
            color: Colors.transparent,
            child: child,
          )
        ],
      ),
    );
  }
}
