import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
class GroupCard extends StatelessWidget {
  final ContactGroupResponse group;
  final int index;
  const GroupCard({super.key,
  required this.group,
  required this.index});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: (){
        Provider.of<BulkSmsProvider>(context,listen: false).selectGroup(group);
        // Navigator.pushNamed(context, Routes.bulkSmsGroupMembers);
      },
      child: Container(
        padding: Paddings.tinyVertical,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('${index+1}. ',style: Blacks.regularBoldCodeNext),
            Spaces.smallSideSpace,
            Container(
              alignment: Alignment.center,
              height: 50,width: 50,
              decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryOrange),
                  shape: BoxShape.circle
              ),
              child: Text(createInitials(createInitials(group.name!)),
                  style: Blacks.mediumSemiRubik),
            ),
            Spaces.smallSideSpace,
            Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(group.name!,style: Blacks.regularSemiRoboto),
                    Text('${group.contactCount!} members',style: Grays.tinyPoppinsHint),
                    Text(group.description??'',style: Blacks.smallestBoldPoppins,
                    overflow: TextOverflow.ellipsis)
                  ],
                )),
            Spaces.smallSideSpace,
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Consumer<BulkSmsProvider>(
                  builder: (_,bulkSms,__) {
                    return Checkbox(
                      activeColor: HexColor(AppColors.primaryGreen),
                      visualDensity: VisualDensity.compact,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        value: bulkSms.selectedGroups.contains(group),
                        onChanged: (val){
                           Provider.of<BulkSmsProvider>(context,listen: false).selectGroup(group);
                        });
                  }
                ),
                GestureDetector(
                  onTap: (){
                    Provider.of<BulkSmsProvider>(context,listen: false).browseGroup(group.id!);
                    Navigator.pushNamed(context, Routes.bulkSmsGroupMembers);
                  },
                  child: Text('View',style: Oranges.underlinedSmallSemiKarla),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
