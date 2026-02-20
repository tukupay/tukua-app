import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class ChurchTeachings extends StatelessWidget {
  const ChurchTeachings({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: SizedBox(
        height: size.height,
        width: size.width,
        child: Stack(
          children: [
            DashBar(title: Text("Videos",style: Whites.mediumSemiRoboto)),
            Positioned(
              top: size.height/7,
                bottom: 0,
                child: Container(
                  height: size.height,
                  width: size.width,
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12)
                  ),
                  child: SingleChildScrollView(
                    primary: true,
                    padding: Paddings.tinyAllSides,
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("All Videos",style: Blacks.smallestBolderPoppins),
                            Consumer<ChurchTeachingsProvider>(
                                builder: (_,churchTeaching,__){ 
                                  return IconButton(
                                      onPressed: (){
                                        churchTeaching.videosView(!churchTeaching.isGrid);
                                      },
                                      icon: Icon(churchTeaching.isGrid?Icons.list:Icons.grid_view_outlined));
                                }),
                          ],
                        ),
                        AuthTextField(
                            hint: "Search Videos"),
                        Spaces.smallTopSpace,
                        Consumer<ChurchTeachingsProvider>(
                            builder: (_,churchTeachings,__){ 
                              return SizedBox(
                                height: size.height,
                                width: size.width,
                                child: churchTeachings.isGrid?
                                GridView.builder(
                                  padding: EdgeInsets.zero,
                                    shrinkWrap: true,
                                    primary: false,
                                    physics: const NeverScrollableScrollPhysics(),
                                    itemCount: 8,
                                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: 2,
                                    childAspectRatio: 0.9,
                                    mainAxisSpacing: 8,
                                    crossAxisSpacing: 8),
                                    itemBuilder: (context,index){
                                    return VideoGridCard();
                                    }):
                                ListView.separated(
                                    itemBuilder: (context,index){
                                      return TileCard();
                                    },
                                    separatorBuilder: (context,index){
                                      return Container(
                                        height: 0.5,
                                        width: size.width,
                                        color: Colors.black,
                                      );
                                    },
                                    padding: EdgeInsets.zero,
                                    shrinkWrap: true,
                                    primary: false,
                                    itemCount: 8),
                              );
                            })
                      ]
                    ),
                  ),
                ))
          ],
        )
      )
    );
  }
}
