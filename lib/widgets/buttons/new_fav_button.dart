import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import '../../constants/constants.dart';

class NewFavButton extends StatelessWidget {
  final void Function() tapped;
  const NewFavButton({super.key,
  required this.tapped});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: tapped,
      child: SizedBox(
        child: Column(
          children: [
            Container(
              height: 50,width: 50,
              padding: Paddings.tinyAllSides,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                      colors: [
                        HexColor(AppColors.primaryGreen),
                        HexColor(AppColors.fadedGreen)
                      ])
              ),
              alignment: Alignment.center,
              child: Icon(Icons.add,color: Colors.white),
            ),
            Text('Add')
          ],
        ),
      ),
    );
  }
}
