import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
class CurrentlyPlayingVideo extends StatelessWidget {
  const CurrentlyPlayingVideo({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Container(
      width: size.width,
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(
              bottomRight: Radius.circular(12),
              bottomLeft: Radius.circular(12)
          ),
          boxShadow: [
            BoxShadow(
                offset:const Offset(1, 2),
                blurRadius: 4,
                spreadRadius: 0,
                color: HexColor('1E232C').withOpacity(.15)
            )
          ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 175,width: size.width,
            decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage(Strings.sampleImageAsset("church.jpg")),
                    fit: BoxFit.cover)
            ),
            child: Stack(
              children: [
                Positioned(
                    top: 4,right: 4,
                    child: IconButton(
                        onPressed: (){
                          const snackBar=SnackBar(content: Text('To mute/unmute'));
                          ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                          ScaffoldMessenger.of(context).showSnackBar(snackBar);
                        },
                        icon:const Icon(HugeIcons.strokeRoundedVolumeMute01,
                            color: Colors.white))),
                Positioned(
                    top: 75,
                    child: Container(
                      alignment: Alignment.center,
                      width: size.width,
                      height: 40,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                              onPressed: (){
                                const snackBar=SnackBar(content: Text('To SHUFFLE'));
                                ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              },
                              icon: const Icon(Icons.shuffle,
                                  size: 30,
                                  color: Colors.white)),
                          IconButton(
                              onPressed: (){
                                const snackBar=SnackBar(content: Text('To PLAY PREVIOUS'));
                                ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              },
                              icon: const Icon(Icons.skip_previous,
                                  color: Colors.white,
                                  size: 30)),
                          IconButton(
                              onPressed: (){
                                const snackBar=SnackBar(content: Text('To PLAY'));
                                ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              },
                              icon: const Icon(Icons.play_circle,
                                color: Colors.white,
                                size: 30,)),
                          IconButton(
                              onPressed: (){
                                const snackBar=SnackBar(content: Text('To PLAY NEXT'));
                                ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              },
                              icon: const Icon(Icons.skip_next,
                                color: Colors.white,
                                size: 30,)),
                          IconButton(
                              onPressed: (){
                                const snackBar=SnackBar(content: Text('To REPEAT'));
                                ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              },
                              icon: const Icon(Icons.repeat,
                                color: Colors.white,
                                size: 30,))
                        ],
                      ),
                    )),
                Positioned(
                    bottom: 5,
                    child: Container(
                      padding: Paddings.smallHorizontal,
                      width: size.width,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("0.00",
                              style: Whites.tinyFaintRoboto),
                          Slider(
                              activeColor: HexColor('15411D'),
                              value: 0.2,
                              onChanged: (val){}),
                          Text("1:24",
                              style:Whites.tinyFaintRoboto),
                          IconButton(
                              onPressed: (){
                                const snackBar=SnackBar(content: Text('To TOGGLE FULL SCREEN'));
                                ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                                ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              },
                              icon: const Icon(Icons.fullscreen,
                                  color: Colors.white))
                        ],
                      ),
                    ))
              ],
            ),
          ),
          Spaces.tinyTopSpace,
          Padding(
            padding: Paddings.smallHorizontal,
            child: Text("SPIRIT OF GRACE & INTERCESSION : PASTOR MORRIS GACHERU : 16 AUGUST 2024",
                style: Blacks.regularBoldCodeNext),
          ),
          Spaces.tinyTopSpace,
          Padding(
            padding: Paddings.smallHorizontal,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                    onPressed: (){
                      const snackBar=SnackBar(content: Text('To download'));
                      ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                      ScaffoldMessenger.of(context).showSnackBar(snackBar);
                    },
                    icon:const Icon(HugeIcons.strokeRoundedDownload01,
                        color: Colors.black)),
                IconButton(
                    onPressed: (){
                      const snackBar=SnackBar(content: Text('To share'));
                      ScaffoldMessenger.maybeOf(context)?.removeCurrentSnackBar();
                      ScaffoldMessenger.of(context).showSnackBar(snackBar);
                    },
                    icon: const Icon(HugeIcons.strokeRoundedShare04,
                        color: Colors.black))
              ],
            ),
          )
        ],
      ),
    );
  }
}
