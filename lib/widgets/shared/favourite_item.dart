import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import '../../constants/constants.dart';


class FavouriteItem extends StatelessWidget {
  final String name;

  const FavouriteItem({super.key,
    required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: Paddings.tinyHorizontal,
      width: 60,
      child: Column(
        children: [
          Container(
            height: 50,
            width: 50,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: HexColor(AppColors.primaryGreen),
            ),
            child: Text(createInitials(name),style: Whites.smallBoldRoboto),
          ),
          Text(name,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12),
          )
        ],
      ),
    );
  }
}
