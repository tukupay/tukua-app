import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/screens/screens.dart';
import '../../routes.dart';
import '../../widgets/widget.dart';

class BulkGroupMembers extends StatefulWidget {
  const BulkGroupMembers({super.key});

  @override
  State<BulkGroupMembers> createState() => _BulkGroupMembersState();
}

class _BulkGroupMembersState extends State<BulkGroupMembers> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_)async{
      await Provider.of<BulkSmsProvider>(context,listen: false).listGroupContacts();
    });
  }

  TextEditingController searchController = TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<BulkSmsProvider>(
        builder: (_, bulkSmsProvider, __) {
      return PopScope(
        onPopInvokedWithResult: (bool b,res){
          bulkSmsProvider.resetGroup();
        },
        child: Scaffold(
            appBar: AppBar(
              leading: IconButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  icon: Icon(Icons.arrow_back, color: HexColor('#404040'))),
              title: Text(bulkSmsProvider.selectedGroup?.name ?? 'Group',
                  style: Blacks.mediumSemiRoboto),
              centerTitle: true,
              actions: [
                IconButton(
                    onPressed: () {
                      Navigator.pushNamed(context, Routes.notifications);
                    },
                    icon: Icon(Icons.notifications, color: Colors.black)),
                Spaces.smallSideSpace
              ],
            ),
            body: SingleChildScrollView(
                primary: true,
                padding: Paddings.smallAllSides,
                child: Container(
                    alignment: Alignment.center,
                    child: Column(children: [
                      Row(
                        children: [
                          Expanded(
                              child: AuthTextField(
                                  hint: 'Search Contact',
                                  controller: searchController)),
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
                                    borderRadius: BorderRadius.circular(8),
                                    color: Colors.white,
                                    border:
                                        Border.all(color: HexColor('#E0E8F2'))),
                                child: Icon(Icons.sort, color: Colors.black),
                              )),
                        ],
                      ),
                      Spaces.smallTopSpace,
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            height: 35,
                            width: 85,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                                color: HexColor('#FCF9E5'),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: HexColor('#E0E8F2'))),
                            child: Text(
                              'Total ${bulkSmsProvider.selectedGroup?.contactCount??0}',
                              style: Blacks.tinyRoboto,
                            ),
                          ),
                        ],
                      ),
                      Spaces.smallTopSpace,
                      bulkSmsProvider.loadingGroupContacts||
                bulkSmsProvider.selectedGroup==null?
                      ListView.separated(
                        physics: const NeverScrollableScrollPhysics(),
                          shrinkWrap: true,
                          itemBuilder: (context,index){
                            return ContactCardShimmer();
                          },
                          separatorBuilder: (context,index)=> Container(
                              height: 2,width: size.width,
                              margin: Paddings.tinyVertical,
                              color: Colors.grey.shade300),
                          itemCount: 5):
                          bulkSmsProvider.selectedGroup!.contacts!.isEmpty?
                              emptyContacts():
                      ListView.separated(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                          itemBuilder: (context,index){
                          Contact contact=bulkSmsProvider.selectedGroup!.contacts![index];
                          return MemberCard(contact: contact, index: index);
                          },
                          separatorBuilder: (context,index)=>
                              Container(
                                margin: Paddings.tinyVertical,
                                  height: 2,width: size.width,
                                  color: Colors.grey.shade300),
                          itemCount: bulkSmsProvider.selectedGroup?.contactCount??0)
                    ])))),
      );
    });
  }
}
