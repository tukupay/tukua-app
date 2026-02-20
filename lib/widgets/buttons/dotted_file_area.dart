import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
class DottedFileArea extends StatelessWidget {
  final void Function()? tapped;
  final Widget child;
  final String? color;
  const DottedFileArea({super.key,
    this.tapped,
  required this.child,
  this.color});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: tapped,
      child: DottedBorder(
        color: Colors.grey[500]!,
        strokeWidth: 1.5,
        dashPattern: [8,6],
        borderType: BorderType.RRect,
        radius: Radius.circular(12),
        child: Container(
          width: size.width,
          height: 175,
          decoration: BoxDecoration(
              color: HexColor( color?? '#FFFFFF'),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: Offset(0, 4)
                )
              ]
          ),
          alignment: Alignment.center,
          child: child,
        ),
      ),
    );
  }
}
