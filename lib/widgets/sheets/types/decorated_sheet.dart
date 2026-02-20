import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';

class DecoratedSheet extends StatelessWidget {
  final String title;
  final Widget body;
  final double height;
  final int? items;
  final bool hasCounter;

  const DecoratedSheet({
    super.key,
    required this.title,
    required this.body,
    required this.height,
    this.items,
    this.hasCounter = true,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      alignment: Alignment.center,
      height: height,
      width: size.width,
      decoration: BoxDecoration(
        color: Colors.white, // Base color to prevent transparency
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        image: DecorationImage(
          image: AssetImage(Strings.imageAsset('sheetbg.png')),
          fit: BoxFit.cover,
        ),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        child: Container(
          height: size.height,
          color: Colors.white.withAlpha(250),
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Text('Close', style: Oranges.smallSemiPoppins),
                    ),
                    Text(title, style: Blacks.tinyBolderPoppins),
                    hasCounter
                        ? Text('All ($items)', style: Blacks.tinyBolderPoppins)
                        : const SizedBox(),
                  ],
                ),
              ),
              OrangeYellow(),
              // Scrollable body to prevent overflow
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: body,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
