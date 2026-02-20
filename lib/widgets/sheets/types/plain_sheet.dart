import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
class PlainSheet extends StatelessWidget {
  final String title;
  final String? subTitle;
  final Widget body;
  final int height;
  const PlainSheet({super.key,
  required this.title,
    this.subTitle,
  required this.body,
  required this.height});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      height: height.toDouble(),
     decoration: BoxDecoration(
       color: Colors.white,
       borderRadius: BorderRadius.only(
         topLeft: Radius.circular(14),
         topRight: Radius.circular(14)
       )
     ),
      padding: Paddings.smallAllSides,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,style: Blacks.regularThinPoppins),
                  Text(subTitle??'',style: Blacks.tinyRubik)
                ],
              ),
              GestureDetector(
                  onTap: (){
                    Navigator.pop(context);
                  },
                  child: Icon(Icons.close,size: 28))
            ],
          ),
          Spaces.smallTopSpace,
          body
        ],
      ),
    );
  }
}
