import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import 'package:tuku/widgets/widget.dart';

class BulkSmsGroups extends StatelessWidget {
  const BulkSmsGroups({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<ContactsProvider>(
      builder: (_,contactProvider,__) {
        return contactProvider.loadingGroups?
              ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: 5,
                  shrinkWrap: true,
                  padding: Paddings.tinyVertical,
                  itemBuilder: (context,index){
                    return GroupCardShimmer();
                  }):
              contactProvider.groups.isEmpty?
                  SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: emptyGroups(context, size)):
          ListView.builder(
            physics: const NeverScrollableScrollPhysics(),
            itemCount: contactProvider.groups.length,
              padding: Paddings.tinyVertical,
            itemBuilder: (context,index){
              ContactGroupResponse group=contactProvider.groups[index];
              return GroupCard(
                  group: group, index: index);
            });
      }
    );
  }
}
