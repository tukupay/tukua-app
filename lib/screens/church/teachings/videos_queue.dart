import 'package:flutter/material.dart';
import 'package:tuku/widgets/widget.dart';
import '../../../constants/constants.dart';

class VideosQueue extends StatelessWidget {
  const VideosQueue({super.key});

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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: Paddings.smallAllSides,
                          child: Row(
                            children: [
                              Text('Teachings',style: Blacks.smallestBolderPoppins),
                              const Icon(Icons.arrow_forward,size: 8),
                              Text('Videos',style: Blacks.regularThinPoppins)
                            ],
                          ),
                        ),
                        CurrentlyPlayingVideo(),
                        Spaces.tinyTopSpace,
                        VideoQueue()
                      ],
                    ),
                  ),
                ))
          ],
        ),
      ),
    );
  }
}
