import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import '../../models/models.dart';
import '../../constants/constants.dart';
class ContactGroupCard extends StatelessWidget {
  final ContactGroupResponse group;
  final int index;
  const ContactGroupCard({super.key,
  required this.group,
  required this.index});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return GestureDetector(
      onTap: (){
        Provider.of<ContactsProvider>(context,listen: false).selectGroup(group);
        Navigator.pushNamed(context, Routes.contactGroupMembers);
      },
      child: Container(
        margin: Paddings.smallestVertical,
          padding: Paddings.smallestAllSides,
          decoration: BoxDecoration(
              color: HexColor('#FEFEFE'),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                    color: HexColor('#27245D1A'),
                    offset: Offset(0, 1),
                    blurRadius: 2,
                    spreadRadius: 0
                ),
                BoxShadow(
                    color: HexColor('#27245D1A'),
                    offset: Offset(0, 1),
                    blurRadius: 3,
                    spreadRadius: 0
                )
              ]
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Text('${index+1}. '),
                      Spaces.smallSideSpace,
                      Text(group.name!,
                          style: Blacks.smallestBolderPoppins),
                    ],
                  ),
                  Text('View',style: TextStyle(
                      color: HexColor(AppColors.primaryOrange),
                      decoration: TextDecoration.underline,
                      decorationColor: HexColor(AppColors.primaryOrange)
                  ))
                ],
              ),
              Spaces.tinyTopSpace,
              Container(
                height: 0.5,width: size.width,
                color: HexColor(AppColors.lightestGray),
              ),
              SizedBox(
                height: 70,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Spaces.smallSideSpace,
                    Container(
                      padding: Paddings.smallAllSides,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: HexColor(AppColors.primaryOrange).withAlpha(200)
                      ),
                      child: Text(createInitials(group.name!),
                      style: Blacks.regularBoldCodeNext),
                    ),
                    Spaces.smallSideSpace,
                    Container(
                      width: 0.5,
                      height: size.height,
                      color: HexColor(AppColors.lightGray),
                    ),
                    Spaces.smallSideSpace,
                    Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            groupInfo('Members', '${group.contactCount}'),
                            groupInfo('Date Created', formatDate(group.createdAt!)),
                            groupInfo('Last Updated', formatDate(group.updatedAt!))
                          ],
                        ))
                  ],
                ),
              )
            ],
          )
      ),
    );
  }
}

Widget groupInfo(String title, String content){
  return Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(title,style: Grays.tinySemiKarla),
      Text(content, style:Grays.tinyPoppinsHint)
    ],
  );
}
