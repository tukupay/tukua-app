import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:in_app_idle_detector/in_app_idle_detector.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tuku/app_theme.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/providers/merchant_provider.dart';
import 'package:tuku/route_tracker.dart';
import 'screens/screens.dart';
import 'routes.dart';
import './widgets/widget.dart';

final GlobalKey<NavigatorState> globalNavKey=GlobalKey<NavigatorState>();

Future<void> main() async{
  WidgetsBinding widgetsBinding=WidgetsFlutterBinding();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);
  if (Platform.isAndroid) {
    await InAppWebViewController.setWebContentsDebuggingEnabled(true);
  }
  // LOAD DOTENV FILE
  await dotenv.load(fileName: ".env");

  final prefs=await SharedPreferences.getInstance();
  final lastExit=prefs.getInt('last_exit');
  if(lastExit!=null){
    final diff=DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(lastExit));
    if(diff.inMinutes >= 3){
      // Backgrounded too long — logout
      final auth=AuthProvider();
      await auth.logout();
    }
  }

  runApp(const MyApp());
  // INIT IDLE DETECTOR
  Timer? _idleTimer;
  int _secondsLeft = 30;

  InAppIdleDetector.initialize(
    timeout: const Duration(minutes: 3),
    onIdle: () async {
      final context = globalNavKey.currentContext;
      if (context != null) {
        final routeName = RouteTracker.currentRoute ?? '';
        debugPrint("==>CURRENT ROUTE IS $routeName <===");

        const exemptRoutes = [
          Routes.login,
          Routes.register,
          Routes.verifyPhone,
        ];

        if (exemptRoutes.contains(routeName)) {
          debugPrint("### IGNORE IDLE WARNING ###");
          return;
        }

        // reset countdown
        _secondsLeft = 30;
        _idleTimer?.cancel();

        // one timer only
        _idleTimer = Timer.periodic(const Duration(seconds: 1), (timer)async{
          _secondsLeft--;
          if (_secondsLeft <= 0) {
            timer.cancel();
            Fluttertoast.showToast(msg: 'GOODBYE!');
            await Provider.of<AuthProvider>(context,listen: false).logout();
            Navigator.pushNamedAndRemoveUntil(context, Routes.login,(route)=>false);
          }
        });

        await showGeneralDialog(
          context: context,
          barrierDismissible: false,
          pageBuilder: (context, anim1, anim2) => const SizedBox(),
          transitionDuration: const Duration(milliseconds: 400),
          transitionBuilder: (context, anim1, anim2, child) {
            return SlideTransition(
              position: Tween(
                begin: const Offset(1, 0),
                end: const Offset(0, 0),
              ).animate(anim1),
              child: StatefulBuilder(
                builder: (context, stateSetter) {
                  // rebuild every second based on _secondsLeft
                  Future.delayed(const Duration(seconds: 1), () {
                    if(context.mounted){
                      stateSetter(() {});
                    }
                  });

                  final minutes =
                  (_secondsLeft ~/ 60).toString().padLeft(2, '0');
                  final seconds =
                  (_secondsLeft % 60).toString().padLeft(2, '0');

                  return SuccessAlert(
                    icon: Icons.warning_sharp,
                    title: 'Logging out in $seconds seconds',
                    content:
                    'You will be logged out due to your inactivity.',
                    isTwo: true,
                    buttonText: "I'm active",
                    altButtonText: "Log Out",
                    tapped: () {
                      _idleTimer?.cancel();
                      Navigator.of(context).pop(); // close dialog
                    },
                    altTap: ()async{
                      await Provider.of<AuthProvider>(context,listen: false).logout();
                      Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route)=>false);
                    },
                    anim1: anim1,
                  );
                },
              ),
            );
          },
        );
      }
    },
    onActive: () {
      debugPrint("### USER IS ACTIVE AGAIN ###");
      _idleTimer?.cancel();
    },
  );

}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String? _lastPage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      SharedPreferences prefs=await SharedPreferences.getInstance();
      _lastPage=prefs.getString('page');
    });

  }
  

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (context)=>AppState()),
          ChangeNotifierProvider(create: (context)=>LoanProvider()),
          ChangeNotifierProvider(create: (context)=>FundraiserProvider()),
          ChangeNotifierProvider(create: (context)=>DummyPaymentProvider()),

          ChangeNotifierProvider(create: (context)=>BulkSmsProvider()),
          ChangeNotifierProvider(create: (context)=>CreditsProvider()),
          ChangeNotifierProvider(create: (context)=>ContactsProvider()),
          ChangeNotifierProvider(create: (context)=>SenderIdsProvider()),
          ChangeNotifierProvider(create: (context)=>SmsProvider()),
          ChangeNotifierProvider(create: (context)=>LocalSmsProvider()),

          ChangeNotifierProvider(create: (context)=>BulkPayProvider()),
          ChangeNotifierProvider(create: (context)=>NotificationProvider()),
          ChangeNotifierProvider(create: (context)=>BillsProvider()),
          ChangeNotifierProvider(create: (context)=>AuthProvider()),
          ChangeNotifierProvider(create: (context)=>ProfileProvider()),
          ChangeNotifierProvider(create: (context)=>KycIndividualProvider()),
          ChangeNotifierProvider(create: (context)=>KycBusinessProvider()),
          ChangeNotifierProvider(create: (context)=>CameraProvider()),
          ChangeNotifierProvider(create: (context)=>WalletProvider()),
          ChangeNotifierProvider(create: (context)=>SignatoryProvider()),
          ChangeNotifierProvider(create: (context)=>BankingProvider()),
          ChangeNotifierProvider(create: (context)=>PosProvider()),
          ChangeNotifierProvider(create: (context)=>MpesaProvider()),
          ChangeNotifierProvider(create: (context)=>BiometricsProvider()),
          ChangeNotifierProvider(create: (context)=>DeviceContactProvider()),
          ChangeNotifierProvider(create: (context)=>PaymentsProvider()),
          ChangeNotifierProvider(create: (context)=>CheckoutProvider()),
          ChangeNotifierProvider(create: (context)=>WebviewProvider()),
          
          ChangeNotifierProvider(create: (context)=>ChurchProvider()),
          ChangeNotifierProvider(create: (context)=>ChurchInviteProvider()),
          ChangeNotifierProvider(create: (context)=>ChurchTeachingsProvider()),
          ChangeNotifierProvider(create: (context)=>TransactionsProvider()),
          
          ChangeNotifierProvider(create: (context)=>FavWalletsProvider()),
          ChangeNotifierProvider(create: (context)=>MerchantProvider()),

          ChangeNotifierProxyProvider2<ProfileProvider, AuthProvider, PinProvider>(
            create: (context) => PinProvider(
              profile: Provider.of<ProfileProvider>(context, listen: false),
              auth: Provider.of<AuthProvider>(context, listen: false),
            ),
            update: (context, profile, auth, previous) {
              // Update mode when profile changes
              previous?.updateModeFromProfile(profile.user?.requiresPinSetup ?? false);
              return previous ?? PinProvider(profile: profile, auth: auth);
            },
          )
        ],
        child: MaterialApp(
          title: 'Tuku',
          navigatorKey: globalNavKey,
          theme: AppTheme.theme,
          initialRoute:  Routes.entry,
          onGenerateRoute: RouteManager.generateRoute,
          navigatorObservers: [RouteTracker()],
            ));
  }
}
