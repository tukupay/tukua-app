import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import '../../widgets/widget.dart';
class ChurchLanding extends StatefulWidget {
  const ChurchLanding({super.key});

  @override
  State<ChurchLanding> createState() => _ChurchLandingState();
}

class _ChurchLandingState extends State<ChurchLanding> {
  TextEditingController searchController=TextEditingController();
  bool searching=false;
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
        body: SizedBox(
          height: size.height,
          width: size.width,
          child: Stack(
            children: [
              DashBar(
                title: Text('My Dashboard',
                    style: Whites.mediumSemiRoboto),
              ),
              Positioned(
                  top: size.height/7,
                  bottom: 0,
                  child: Container(
                    height: size.height,
                    width: size.width,
                    decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        color: Colors.white
                    ),
                    child: SingleChildScrollView(
                      padding: Paddings.smallAllSides,
                      primary: true,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Text('My Churches [1]',style: Blacks.regularBoldGrotesk),
                          // Spaces.smallTopSpace,
                          // const MyChurchCard(),
                          // Spaces.smallTopSpace,
                          // Text('Explore Churches',style: Blacks.smallestBoldPoppins),
                          // Spaces.smallTopSpace,
                          // ChurchSearch(hint: 'Search Churches...',
                          //     controller: searchController,
                          //     changed: (val){
                          //       setState(() {
                          //         searchController.text=val;
                          //       });
                          //       if(val.isNotEmpty){
                          //         setState(() {
                          //           searching=true;
                          //         });
                          //         final snackBar=SnackBar(content: Text('Search for $val'));
                          //         ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                          //         ScaffoldMessenger.of(context).showSnackBar(snackBar);
                          //       }else{
                          //         setState(() {
                          //           searching=false;
                          //         });
                          //       }
                          //     }),
                          Spaces.smallTopSpace,
                          ListView.builder(
                            physics: const NeverScrollableScrollPhysics(),
                              padding: EdgeInsets.zero,
                              primary: false,
                              itemCount:8,
                              shrinkWrap: true,
                              itemBuilder: (context,index){
                                return ExploreChurchCard(index: index);
                              }),
                        ],
                      ),
                    ),
                  ))
            ],
          ),
        )
    );
  }
}
