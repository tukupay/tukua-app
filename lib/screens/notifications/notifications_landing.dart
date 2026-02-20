import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/screens/screens.dart';
class Notifications extends StatefulWidget {
  const Notifications({super.key});

  @override
  State<Notifications> createState() => _NotificationsState();
}

class _NotificationsState extends State<Notifications> {
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<NotificationProvider>(context,listen: false).getAllNotifications();
      await Provider.of<NotificationProvider>(context,listen: false).getUnreadNotifications();
      await Provider.of<NotificationProvider>(context,listen: false).getPreferences();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: Icon(Icons.arrow_back, color: HexColor('#404040'))),
        title: Text('Notifications', style: Blacks.mediumSemiRoboto),
        centerTitle: true,
        actions: [
          IconButton(
              onPressed: (){
                Navigator.pushNamed(context, Routes.notificationSettings);
              },
              icon: const Icon(Icons.settings,color: Colors.black))
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (_,provider,__) {
          return DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  TabBar(
                    isScrollable: true,
                      tabAlignment: TabAlignment.center,
                      indicatorColor: HexColor('#15411D'),
                      unselectedLabelStyle: Grays.regularSemiInter,
                      labelStyle: Oranges.regularSemiInter,
                      tabs: [
                        Tab(text: 'All'),
                        Tab(text: 'Unread (${provider.notificationStats?.unreadCount??0})'),
                        // Tab(text: 'Read')
                      ]),
                  Expanded(
                    child: TabBarView(
                          children: [
                            AllNotifications(),
                            UnreadNotifications(),
                            // ReadNotifications()
                          ]),
                  )
                ],
              ));
        }
      )
    );
  }
}
