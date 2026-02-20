import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class SuccessWalletCreate extends StatelessWidget {
  final Animation<double> anim1;
  final List<Widget> gridItems;
  final String title;
  const SuccessWalletCreate({super.key,
  required this.anim1,
  required this.gridItems,
  required this.title});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SlideTransition(
        position: Tween(
          begin: const Offset(0, 1),
          end: const Offset(0, 0)
        ).animate(anim1),
    child: AlertDialog(
      insetPadding: Paddings.mediumHorizontal,
      contentPadding: EdgeInsets.zero,
      elevation: 0,
      backgroundColor: Colors.white,
      content: SizedBox(
        width: size.width,
        height: 390,
        child: Center(
          child: Stack(
            fit: StackFit.loose,
            alignment: Alignment.topCenter,
            clipBehavior: Clip.none,
            children: [
              // MAIN CONTENT
              Positioned.fill(
                top: 40,
                child: Container(
                  padding: Paddings.tinyAllSides,
                  decoration: BoxDecoration(

                  ),
                  child: Column(
                    children: [
                      Text('Operation Success',style: Blacks.regularBoldCodeNext),
                      Text(title,style: Blacks.smallestBoldPoppins),
                      Spaces.smallTopSpace,
                      Container(
                        height: 0.5,
                        width: size.width,
                        color: Colors.black.withAlpha(35)),
                      Spaces.smallTopSpace,
                      GridView.count(
                        padding: EdgeInsets.zero,
                        childAspectRatio: 2.0,
                        shrinkWrap: true,
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        children: gridItems,
                      ),
                      Spaces.mediumTopSpace,
                      AltGreenButton(
                          tapped: (){
                            Provider.of<WalletProvider>(context,listen: false).resetSteps();
                            Navigator.pop(context);
                            Navigator.pop(context);
                          },
                          text: 'Home')
                    ],
                  ),
                ),
              ),
            //   FLOATING CHECKED CIRCLE
              Positioned(
                  top: -40,
                  child: Container(
                    padding: Paddings.smallAllSides,
                    decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.shade300,
                          offset: Offset(2,4),
                        ),
                      ]
                    ),
                    child: Container(
                        height: 40,width: 40,
                        decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: HexColor(AppColors.primaryOrange)
                        ),
                        child: Icon(Icons.check,
                            color: Colors.white)),
                  )),
            ],
          ),
        ),
      ),
    ),
    );
  }
}


