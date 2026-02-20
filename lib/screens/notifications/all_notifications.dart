import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class AllNotifications extends StatefulWidget {
  const AllNotifications({super.key});

  @override
  State<AllNotifications> createState() => _AllNotificationsState();
}

class _AllNotificationsState extends State<AllNotifications> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<NotificationProvider>(context, listen: false);
    if (provider.allNotifications.isEmpty) {
      provider.getAllNotifications(isRefresh: true);
    }
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      Provider.of<NotificationProvider>(context, listen: false)
          .getAllNotifications();
    }
  }

  Future<void> _onRefresh() async {
    await Provider.of<NotificationProvider>(context, listen: false)
        .getAllNotifications(isRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      body: SizedBox(
        height: size.height,
        width: size.width,
        child: Consumer<NotificationProvider>(builder: (_, provider, __) {
          if (provider.loadingAllNotifications && provider.allNotifications.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.allNotifications.isEmpty) {
            return RefreshIndicator(
              onRefresh: _onRefresh,
              child: Stack(
                alignment: Alignment.center,
                children: [ 
                  ListView(),
                  EmptyNotifications(hint: "All your notifications will appear here"),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _onRefresh,
            child: ListView.separated(
              controller: _scrollController,
              separatorBuilder: (context, index) => Container(
                width: size.width,
                height: 1,
                color: HexColor('#E4E8EE'),
              ),
              itemCount: provider.allNotifications.length + (provider.loadingMoreAll ? 1 : 0),
              padding: EdgeInsets.zero,
              itemBuilder: (context, index) {
                if (index == provider.allNotifications.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                NotificationModel notification = provider.allNotifications[index];
                return NotificationCard(notification: notification);
              },
            ),
          );
        }),
      ),
    );
  }
}
