import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class GroupsMgt extends StatelessWidget {
  const GroupsMgt({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text('Manage Groups', style: Blacks.mediumSemiRubik),
          actions: [
            NotificationsBell(),
            Spaces.smallSideSpace,
          ],
        ),
        body: RefreshIndicator(
          onRefresh: ()async{
            await Provider.of<ContactsProvider>(context,listen: false).listContactGroups();
          },
          child: Consumer<ContactsProvider>(
            builder: (_,contactsProvider,__) {
              return Container(
                width: size.width,
                height: size.height,
                padding: Paddings.smallAllSides,
                decoration: BoxDecoration(
                  image: DecorationImage(
                      image: AssetImage(Strings.imageAsset('bg.png')))
                ),
                child: contactsProvider.groups.isEmpty?
                emptyGroups(context, size):
                SingleChildScrollView(
                  primary: true,
                  child: Column(
                    children: [
                      Container(
                        color: Colors.white,
                        child: Column(
                          children: [
                            // COUNTER & ADD GROUP
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('TOTAL GROUPS: ${contactsProvider.groups.length}',
                                    style: Blacks.regularBoldCodeNext),
                                AddButton(
                                  tapped: (){
                                    Navigator.pushNamed(context, Routes.newGroup);
                                  },
                                  text: "ADD GROUP",
                                )
                              ],
                            ),
                            Spaces.smallTopSpace,
                            // SEARCH & SORT GROUPS
                            Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  // Search
                                  Expanded(
                                      child: AuthTextField(
                                          hint: 'Search Groups')),
                                  Spaces.tinySideSpace,
                                  GestureDetector(
                                    onTap: () {},
                                    child: Container(
                                      height: 42,
                                      width: 42,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(8),
                                          color: Colors.white,
                                          border: Border.all(color: HexColor('#E0E8F2'))),
                                      child: Icon(Icons.search, color: Colors.black),
                                    ),
                                  ),
                                  Spaces.tinySideSpace,
                                  // add group btn
                                  GestureDetector(
                                      onTap: () {},
                                      child: Container(
                                        height: 42,
                                        width: 42,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                            border: Border.all(color: HexColor('#E0E8F2')),
                                            borderRadius: BorderRadius.circular(8)),
                                        child: Icon(HugeIcons.strokeRoundedPreferenceHorizontal,
                                            color: Colors.black),
                                      )),
                                ]
                            ),
                          ],
                        ),
                      ),
                      Spaces.smallTopSpace,
                      // GROUPS
                      contactsProvider.loadingGroups?
                      const Center(child: CircularProgressIndicator()):
                      ListView.builder(
                        itemCount: contactsProvider.groups.length,
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemBuilder: (context, index) {
                          ContactGroupResponse group=contactsProvider.groups[index];
                          return ContactGroupCard(group: group,index: index);
                        }
                      )
                    ]
                  ),
                ),
              );
            }
          ),
        ));
  }
}

Widget emptyGroups(BuildContext context, Size size){
  return Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Spaces.largeTopSpace,
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryGreen).withAlpha(12),
            shape: BoxShape.circle,
          ),
          child: Icon(
            HugeIcons.strokeRoundedUserGroup,
            size: 48,
            color: HexColor(AppColors.primaryGreen).withAlpha(150),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          "No groups yet",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: HexColor(AppColors.primaryGreen),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Create groups to organize your contacts\nfor bulk payments and messaging.",
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            color: HexColor(AppColors.darkerGray2),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: size.width/2,
          child: AuthButton(
              text: "Create a Group",
              tapped: (){
                Navigator.pushNamed(context, Routes.newGroup);
              }),
        )
      ],
    ),
  );
}