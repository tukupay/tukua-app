import 'package:flutter/material.dart';

import '../../constants/constants.dart';

class LoadingSplash extends StatelessWidget {
  const LoadingSplash({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
            child: Image.asset(
                height: size.height / 2,
                width: size.width / 2,
                Strings.iconImage('tuku.png'))));
  }
}
