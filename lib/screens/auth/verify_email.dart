import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
class VerifyEmail extends StatefulWidget {
  const VerifyEmail({super.key});

  @override
  State<VerifyEmail> createState() => _VerifyEmailState();
}

class _VerifyEmailState extends State<VerifyEmail> with WidgetsBindingObserver{

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if(state==AppLifecycleState.resumed){
      // Navigator.pushNamedAndRemoveUntil(
      //     context, Routes.captureId, (route)=>false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: Container(
        height: size.height,
        width: size.height,
        alignment: Alignment.bottomCenter,
        decoration: BoxDecoration(
          image: DecorationImage(
              image: AssetImage(Strings.imageAsset('curve1.png')),
          alignment: Alignment.topCenter)
        ),
        child: Padding(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).viewInsets.top
            ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(Strings.iconImage('inbox.png'),
                  height: size.height/4,
                  width: size.width/2,
              fit: BoxFit.cover),
              Spaces.smallTopSpace,
              Padding(
                padding: Paddings.smallestAllSides,
                child: Consumer2<AuthProvider,ProfileProvider>(
                  builder: (_,auth,profile,__) {
                    return Text('A verification email has been sent to your email ${auth.email??profile.user?.email} ',
                    style: Blacks.mediumSemiRoboto,
                    textAlign: TextAlign.center);
                  }
                ),
              ),
              Spaces.mediumTopSpace,
              Padding(
                padding: Paddings.smallestAllSides,
                child: Text('Go to this email\'s inbox, verify then come back. We will wait for you.',
                  style: Grays.regularLightSemiPoppins,
                textAlign: TextAlign.center),
              ),
              Container(
                height: size.height/5,
                decoration: BoxDecoration(
                  image: DecorationImage(
                      image: AssetImage(Strings.imageAsset('curve2.png')),
                  alignment: Alignment.centerLeft)
                ),
              )
            ],
          ),
        ),
        ),
      ),
    );
  }
}
