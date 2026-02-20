import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

import '../../routes.dart';
import '../../widgets/widget.dart';
class SelectContacts extends StatefulWidget {
  const SelectContacts({super.key});

  @override
  State<SelectContacts> createState() => _SelectContactsState();
}

class _SelectContactsState extends State<SelectContacts> {
  final searchController=TextEditingController();
  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: (){
              Navigator.pop(context);
            },
            icon: Icon(Icons.arrow_back,
                color: HexColor('#404040'))),
        title: Text('Select Contacts',
            style: Blacks.mediumSemiRoboto),
        centerTitle: true,
        actions: [
          IconButton(
              onPressed: (){
                Navigator.pushNamed(context, Routes.notifications);
              },
              icon: Icon(Icons.notifications,color: Colors.black)),
          Spaces.smallSideSpace
        ],
      ),
      body: Consumer2<BulkPayProvider,ContactsProvider>(
        builder: (_,bulkPay,contactProvider,__) {
          // Check if there are manual entries
          final hasManualEntries = bulkPay.selectedContacts.any((c) =>
            c.deviceContact != null &&
            c.deviceContact!.phoneNumber == c.deviceContact!.fullName
          );

          // Check if there's a selected group with contacts
          final hasGroupContacts = bulkPay.groupContacts?.contacts?.isNotEmpty ?? false;

          return Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                child: SingleChildScrollView(
                  padding: Paddings.smallAllSides,
                  primary: true,
                  child: Column(
                    children: [
                      // Only show search and group selector if not using manual entries exclusively
                      if (!hasManualEntries || hasGroupContacts) ...[
                        Row(
                          children: [
                            SizedBox(
                                width: size.width/1.7,
                                child: AuthTextField(
                                    hint: 'Search Contact',
                                    controller: searchController)),
                            Spaces.tinySideSpace,
                          ],
                        ),
                        Spaces.smallTopSpace,
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              height: 40,width: 165,
                              alignment: Alignment.center,
                              child: DropdownMenu<ContactGroupResponse>(
                                textAlign: TextAlign.start,
                                  textStyle: Blacks.tinyRubik,
                                  inputDecorationTheme: InputDecorationTheme(
                                    enabledBorder: OutlineInputBorder(
                                      borderSide: BorderSide(
                                        color: HexColor('#544C4C').withAlpha(50),
                                      ),
                                      borderRadius: BorderRadius.circular(6)
                                    )
                                  ),
                                  initialSelection: bulkPay.selectedGroup,
                                  onSelected: (val){
                                  if(val!=null){
                                    Provider.of<BulkPayProvider>(context,listen: false).selectGroup(val);
                                  }
                                  },
                                  expandedInsets: EdgeInsets.zero,
                                  dropdownMenuEntries: contactProvider.groups.map((element)=>
                                  DropdownMenuEntry(
                                      value: element,
                                      label: element.name!)).toList()
                              ),
                            ),
                            GestureDetector(
                              onTap: (){
                                Navigator.pushNamed(context, Routes.groups);
                              },
                              child: Container(
                                padding: Paddings.tinyAllSides,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(6),
                                  color: HexColor('#15411D'),
                                ),
                                child: Row(
                                  children: [
                                    Text('Edit Groups',style: Whites.smallBoldRoboto),
                                    Spaces.tinySideSpace,
                                    Icon(Icons.add_box_rounded,color: Colors.white)
                                  ],
                                ),
                              ),
                            )
                          ],
                        ),
                        Spaces.smallTopSpace,
                      ],

                      // Show manual entries if they exist
                      if (hasManualEntries) ...[
                        const ManualContactsList(),
                        Spaces.smallTopSpace,
                      ],

                      // Show group contacts if available
                      if (hasGroupContacts) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${bulkPay.selectedGroup?.name??dummyGroups[0].name} Group',style: Blacks.tinyBolderPoppins),
                            Row(
                              children: [
                                Text('Select All'),
                                Checkbox(
                                    value: bulkPay.selectAll,
                                    onChanged: (val){
                                      Provider.of<BulkPayProvider>(context,listen: false).selectAllContacts();
                                    },
                                activeColor: HexColor('#EE7D13'))
                              ],
                            )
                          ],
                        ),
                        Spaces.smallTopSpace,
                        ListView.separated(
                          primary: false,
                          shrinkWrap: true,
                            itemBuilder: (context,index){
                              Contact contact=bulkPay.groupContacts!.contacts![index];
                              return RecipientAmountCard(contact: BulkPayContact(contact: contact),index: index);
                            },
                            separatorBuilder: (context,index)=>Container(
                                height: 2,width: size.width,
                                color: Colors.grey.shade300),
                            itemCount: bulkPay.groupContacts!.contacts!.length),
                      ],
                      Spaces.largeTopSpace,
                      Spaces.largeTopSpace,
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 12,
                child: AltGreenButton(
                    tapped: (){
                      Navigator.pushNamed(context, Routes.bulkAmount);
                    },
                    text: 'Proceed'),
              )
            ],
          );
        }
      )
    );
  }
}
