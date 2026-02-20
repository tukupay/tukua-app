import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import '../widget.dart';
import '../../providers/providers.dart';

class BulkSmsTabBar extends StatelessWidget implements PreferredSizeWidget{
  const BulkSmsTabBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: HexColor(AppColors.lightestGray),
          ),
          borderRadius: BorderRadius.circular(4)
      ),
      child: TabBar(
          dividerColor: Colors.transparent,
          indicator: BoxDecoration(
              border: Border.fromBorderSide(
                  BorderSide(
                      color: HexColor(AppColors.primaryGreen))),
              borderRadius: BorderRadius.circular(4)
          ),
          labelColor: HexColor(AppColors.primaryGreen),
          indicatorSize: TabBarIndicatorSize.tab,
          indicatorPadding: EdgeInsets.all(6),
          tabs:  [
            Tab(text: 'Individual'),
            Tab(text: 'Groups')
          ]),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(48);
}

class BulkSmsTabViews extends StatelessWidget {
  const BulkSmsTabViews({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: TabBarView(
        children: [
          BulkSmsIndividual(),
          BulkSmsGroups()
        ],
      ),
    );
  }
}

class BulkSmsTabs extends StatelessWidget {
  const BulkSmsTabs({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("TO:",style: Blacks.smallestBolderPoppins),
          const SizedBox(height: 8),
          Container(
            padding: Paddings.tinyAllSides,
            child: Row(
                children: [
                  Expanded(
                      child: AuthTextField(
                          changed: (value) {
                            Provider.of<DeviceContactProvider>(context,listen:false).searchContacts(value);
                          },
                          hint: 'Search contacts')),
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
          ),
          const SizedBox(height: 8),
          const DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  BulkSmsTabBar(),
                  Expanded(
                      child: TabBarView(
                          children: [
                            BulkSmsIndividual(),
                            BulkSmsGroups()
                          ]
                      ))
                ],
              ))
        ],
      ),
    );
  }
}
