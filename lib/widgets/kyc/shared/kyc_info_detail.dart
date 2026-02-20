import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
class KycInfoDetail extends StatelessWidget {
  final String title;
  final String content;
  final String? textColor;
  const KycInfoDetail({super.key,
  required this.title,
  required this.content,
  this.textColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.center,
      margin: Paddings.tinyVertical,
      padding: Paddings.tinyVertical,
      decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: Colors.black.withAlpha(30))
          )
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(child: Text(title,style: TextStyle(color: HexColor('6B7582')),)),
          Flexible(child: Text(content,overflow: TextOverflow.ellipsis,
          style: TextStyle(color: HexColor(textColor??'000000')),))
        ],
      ),
    );
  }
}
