import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class UnreadNotifications extends StatefulWidget {
  const UnreadNotifications({super.key});

  @override
  State<UnreadNotifications> createState() => _UnreadNotificationsState();
}

class _UnreadNotificationsState extends State<UnreadNotifications> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<NotificationProvider>(context, listen: false);
    // Fetch initial data only if the list is empty
    if (provider.unreadNotifications.isEmpty) {
      provider.getUnreadNotifications(isRefresh: true);
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
          .getUnreadNotifications();
    }
  }

  Future<void> _onRefresh() async {
    await Provider.of<NotificationProvider>(context, listen: false)
        .getUnreadNotifications(isRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      body: SizedBox(
        height: size.height,
        width: size.width,
        child: Consumer<NotificationProvider>(builder: (_, provider, __) {
          // Use the correct loading flag for the initial fetch
          if (provider.loadingUnreadNotifications && provider.unreadNotifications.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.unreadNotifications.isEmpty) {
            return RefreshIndicator(
              onRefresh: _onRefresh,
              child: Stack(
                alignment: Alignment.center,
                children: [ // To allow scroll for refresh
                  ListView(),
                  EmptyNotifications(hint: "You have no unread notifications"),
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
              // Use the correct list and loading flag
              itemCount: provider.unreadNotifications.length + (provider.loadingMoreUnread ? 1 : 0),
              padding: EdgeInsets.zero,
              itemBuilder: (context, index) {
                if (index == provider.unreadNotifications.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                NotificationModel notification = provider.unreadNotifications[index];
                return NotificationCard(notification: notification);
              },
            ),
          );
        }),
      ),
    );
  }
}
