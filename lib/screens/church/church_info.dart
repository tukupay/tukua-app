import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class ChurchInfo extends StatelessWidget {
  const ChurchInfo({super.key});

  
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: PopScope(
          onPopInvokedWithResult: (invoked,result){

          },
          child: SizedBox(
            height: size.height,
            width: size.width,
            child: Stack(
              children: [
                TabsAppBar(
                    image: Strings.sampleImageAsset("church.jpg"),
                    city: "Thika Road",
                    location: "Nairobi, Kenya",
                    leadingTapped: (){
                      Navigator.pop(context);
                    },
                    name: "JCC Thika Road",
                    total: 8),
                Positioned(
                    top: size.height/3,
                    bottom: 0,
                    child: Container(
                      height: size.height,
                      width: size.width,
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(23)
                      ),
                      child: DefaultTabController(
                        length: 3,
                        child: Column(
                          children: [
                            TabBar(
                                padding:const EdgeInsets.only(top: 12),
                                tabAlignment: TabAlignment.start,
                                isScrollable: true,
                                labelStyle: Blacks.regularKarla,
                                indicatorColor: HexColor('EE7D13'),
                                tabs: const [
                                  Tab(text: 'About'),
                                  Tab(text: 'Location'),
                                  Tab(text: 'Media'),
                                ]),
                            Expanded(
                              child: TabBarView(
                                  children: [
                                    AboutTab(),
                                    const LocationTab(),
                                    const MediaTab()
                                  ]),
                            ),
                          ],
                        ),
                      ),
                    )),
                Positioned(
                    bottom: 10,
                    right: size.width/12,
                    child: Center(
                      child: AuthButton(
                          text: 'Install',
                          tapped: (){
                            Provider.of<ChurchProvider>(context, listen: false)
                                .installMerchant();
                            Fluttertoast.cancel();
                            Fluttertoast.showToast(
                              msg: "Merchant installed successfully",
                              backgroundColor: HexColor(AppColors.primaryGreen),
                            );
                            Navigator.pushReplacementNamed(context, Routes.myChurch);
                          }),
                    )),
              ],
            ),
          ))
    );
  }
}
