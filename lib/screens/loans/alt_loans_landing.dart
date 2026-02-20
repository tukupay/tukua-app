import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class AltLoansLanding extends StatelessWidget {
  const AltLoansLanding({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: HexColor('#F8FAF9'),
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('bg.png')),
              fit: BoxFit.cover)
        ),
        child: Container(
          height: size.height,
          width: size.width,
          decoration: BoxDecoration(
            image: DecorationImage(
                image: AssetImage(Strings.imageAsset('gradient2.png')),
            fit: BoxFit.cover)
          ),
          child: Column(
            children: [
              // Custom App Bar matching fundraiser style
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      const Spacer(),
                      Column(
                        children: [
                          Text('Loans', style: Blacks.mediumSemiRubik),
                          const SizedBox(height: 2),
                          Text('Build your loan eligibility',
                              style: Grays.smallestPoppinsHint.copyWith(fontSize: 10)),
                        ],
                      ),
                      const Spacer(),
                      NotificationsBell(),
                      Spaces.tinySideSpace,
                    ],
                  ),
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: Paddings.smallAllSides,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Image.asset(
                        Strings.iconImage('loans.png'),

                        height: 160,
                      ),
                      const SizedBox(height: 24),
                      Text('Loan Limit: KSH 0', style: Blacks.mediumSemiRubik),
                      const SizedBox(height: 8),
                      Text(
                        'Transact more to build your loan eligibility.',
                        style: Grays.smallestPoppinsHint,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: size.width / 2,
                        child: AltGreenButton(
                            tapped: () {
                              Provider.of<AppState>(context, listen: false).selectTab(0);
                            },
                            text: 'Go to Home'),
                      )
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
