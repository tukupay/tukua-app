import 'package:flutter/material.dart';

import '../../constants/constants.dart';
class SuccessGridItem extends StatelessWidget {
  final String title;
  final String content;
  const SuccessGridItem({super.key,
  required this.title,
  required this.content});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      width: size.width,
      padding: Paddings.tinyAllSides,
      decoration: BoxDecoration(
          border: Border.all(
              color: Colors.black.withAlpha(35)
          ),
          borderRadius: BorderRadius.circular(6)
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: TextStyle(color: Colors.black,fontSize: 12,
                  fontWeight: FontWeight.bold)),
          Text(content,
              style: TextStyle(color: Colors.black,fontSize: 12))
        ],
      ),
    );
  }
}
