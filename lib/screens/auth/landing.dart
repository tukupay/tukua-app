import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
class Landing extends StatelessWidget {
  const Landing({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SizedBox(
        child: Text('LANDING',style:Blacks.largeSemiPoppins),
      ),
    );
  }
}
