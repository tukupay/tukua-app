import 'package:custom_linear_progress_indicator/custom_linear_progress_indicator.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../../routes.dart';
class Processing extends StatelessWidget {
  const Processing({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<DummyPaymentProvider>(
      builder: (_,payment,__) {
        return 
          payment.processing?
          Container(
            padding: Paddings.smallAllSides,
            height: 500,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CustomLinearProgressIndicator(
                maxValue: 1, // new
                value: 1,
                minHeight: 12,
                borderWidth: 0,
                borderStyle: BorderStyle.solid,
                colorLinearProgress: Colors.black,
                animationDuration: 3000,
                borderRadius: 28,
                linearProgressBarBorderRadius: 28,
                backgroundColor: Colors.green.shade50,
                progressAnimationCurve: Curves.bounceInOut, // new
                alignment: Alignment.center, // new
                showPercent: false,// new
                percentTextStyle: const TextStyle(fontWeight: FontWeight.bold),
                gradientColors: const [Colors.purple, Colors.blue, Colors.blueAccent], // new
                onProgressChanged: (double value) {
                  // new
                },
              ),
              Spaces.tinyTopSpace,
              Text('Processing...',style: Blacks.mediumThinInter),
              Spaces.mediumTopSpace,
              SheetButton(
                  hasIcon: false,
                  enabled: false,
                  text: 'Confirm & Pay')
            ],
          ),
        ):SizedBox(
            height: 500,
            width: size.width,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  height: 350,
                  width: size.width,
                  decoration: BoxDecoration(
                      image: DecorationImage(
                          image: AssetImage(Strings.imageAsset('dots.png')),
                          fit: BoxFit.contain)
                  ),
                  child: Container(
                    height: 250,width: 250,
                    decoration: BoxDecoration(
                      image: DecorationImage(
                          image: AssetImage(Strings.imageAsset('paysuccess.png')),
                      fit: BoxFit.contain),
                      color: Colors.transparent
                    ),
                  ),
                ),
                Spaces.mediumTopSpace,
                Text('Top Up Successful!',style: Greens.mediumSemiInter),
                Spaces.smallTopSpace,
                SheetButton(
                  hasIcon: false,
                  enabled: true,
                    text:'DONE',
                    tapped: (){
                      Navigator.of(context).popUntil((route) => route.settings.name == Routes.home || route.isFirst);
                    })
              ],
            ),
          );
      }
    );
  }
}
