import 'package:blurrycontainer/blurrycontainer.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import '../../../constants/constants.dart';

class TabsAppBar extends StatelessWidget {
  final String image;
  final void Function() leadingTapped;
  final String name;
  final int total;
  final String? location;
  final String? city;
  final String? department;
  const TabsAppBar({super.key,
    required this.image,
    required this.leadingTapped,
    required this.name,
    required this.total,
    this.location,
    this.city,
    this.department});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
        width: size.width,
        height: size.height/2.5,
        decoration: BoxDecoration(
            image: DecorationImage(
                image: AssetImage(image),
                fit: BoxFit.cover)
        ),
        child: BlurryContainer(
            blur: 4,
            color: HexColor('036930').withOpacity(.38),
            child: Padding(
              padding: EdgeInsets.only(
                  top: MediaQuery.of(context).viewPadding.top
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: leadingTapped,
                    child: Container(
                      width: size.width/10,
                      height: 42,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child:const Icon(Icons.arrow_back_ios_rounded,
                          color: Colors.black,
                          size: 16),
                    ),
                  ),
                  Expanded(
                      child: Container(
                        padding: Paddings.tinyAllSides,
                        child: Column(
                          children: [
                            Container(
                              height: 100,width: 104,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                image: DecorationImage(
                                    image: AssetImage(image),
                                    fit: BoxFit.cover),
                                border:Border.all(
                                    color: HexColor('F8F8F8'),
                                    width: 2
                                ),
                              ),
                            ),
                            Text(name,
                                style: Whites.regularRoboto),
                            Text("members counter",style: Whites.tinyFaintRoboto),
                            Text(city??'',
                                style: Whites.smallSemiKarla),
                            Text(location??department??'',
                                style: Whites.smallSemiKarla)
                          ],
                        ),
                      )),
                  SizedBox(
                    width: size.width/12,
                    height: 42,
                    child:const  Icon(Icons.more_horiz,color: Colors.white,),
                  )
                ],
              ),
            ))
    );
  }
}
