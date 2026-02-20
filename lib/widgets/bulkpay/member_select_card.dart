import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import '../../constants/constants.dart';
import '../../providers/providers.dart';

class MemberSelectCard extends StatelessWidget {
  final BulkPayContact contact;
  const MemberSelectCard({super.key,
  required this.contact});

  @override
  Widget build(BuildContext context) {
    return Consumer<BulkPayProvider>(
      builder: (_,bulkPay,__) {
        return Container(
          padding: Paddings.tinyVertical,
          child: Row(
            children: [
              Checkbox(
                  fillColor: WidgetStatePropertyAll(HexColor(AppColors.lightGray)),
                  checkColor: HexColor(AppColors.primaryOrange),
                  value: bulkPay.selectedContacts.contains(contact),
                  onChanged: (val){
                    Provider.of<BulkPayProvider>(context,listen: false).selectContact(contact);
                  }),
              Container(
                height: 45,width: 45,
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: HexColor(AppColors.primaryOrange)
                ),
                alignment: Alignment.center,
                child: Text(createInitials(contact.name)),
              ),
              Spaces.smallSideSpace,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(contact.name,style: Blacks.regularSemiRoboto),
                    Text(contact.phone!,style: Grays.tinyPoppinsHint),
                    // Text(contact.description,style: Blacks.smallestBoldPoppins,
                    //     overflow: TextOverflow.ellipsis)
                  ],
                ),
              ),
              Spaces.smallSideSpace,
            ],
          ),
        );
      }
    );
  }
}
