import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/widget.dart';

import '../../providers/providers.dart';
import '../screens.dart';
class RequestedSenderIds extends StatefulWidget {
  const RequestedSenderIds({super.key});

  @override
  State<RequestedSenderIds> createState() => _RequestedSenderIdsState();
}

class _RequestedSenderIdsState extends State<RequestedSenderIds> {

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<SenderIdsProvider>(context,listen: false).getSenderIdRequests();
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      body: Consumer<SenderIdsProvider>(
        builder: (_,senderIdsProvider,__) {
          return Container(
            padding: Paddings.smallAllSides,
            child: senderIdsProvider.loadingSenderIdRequests?
            Center(child: const CircularProgressIndicator()):
            senderIdsProvider.senderIdRequests.isEmpty?
            emptySenderIds(context,size):
            ListView.builder(
              itemCount: senderIdsProvider.senderIdRequests.length,
              shrinkWrap: true,
              itemBuilder: (context,index){
                SenderIdResponse request=senderIdsProvider.senderIdRequests[index];
                return SenderIdRequestCard(senderId: request);
              },
            ),
          );
        }
      )
    );
  }
}
