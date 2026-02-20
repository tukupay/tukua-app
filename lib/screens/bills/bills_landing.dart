import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/widgets/widget.dart';
import '../../constants/constants.dart';
import '../../routes.dart';

// Dummy Model for a Bill
class Bill {
  final String name;
  final IconData icon;
  Bill({required this.name, required this.icon});
}

class BillsLanding extends StatelessWidget {
  const BillsLanding({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // Dummy lists for all bill categories
    final List<Bill> favouriteBills = [
      Bill(name: 'KPLC', icon: HugeIcons.strokeRoundedBulb),
      Bill(name: 'Water', icon: HugeIcons.strokeRoundedWaterPump),
      Bill(name: 'Wi-Fi', icon: HugeIcons.strokeRoundedWifi01),
      Bill(name: 'Rent', icon: HugeIcons.strokeRoundedHome01),
    ];

    final List<Bill> myBills = [
      Bill(name: 'Netflix', icon: HugeIcons.strokeRoundedTvSmart),
      Bill(name: 'Spotify', icon: HugeIcons.strokeRoundedFileAudio),
    ];

    final List<Bill> homeBills = [
      Bill(name: 'Security', icon: HugeIcons.strokeRoundedAiSecurity01),
      Bill(name: 'Gardening', icon: HugeIcons.strokeRoundedPlant03),
    ];

    final List<Bill> otherBills = [
      Bill(name: 'School', icon: HugeIcons.strokeRoundedSchool01),
    ];

    return Scaffold(
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
            image: DecorationImage(
                image: AssetImage(Strings.imageAsset('bg.png')),
                fit: BoxFit.cover)),
        child: Container(
          height: size.height,
          width: size.width,
          // decoration: BoxDecoration(
          //     image: DecorationImage(
          //         image: AssetImage(Strings.imageAsset('gradient2.png')),
          //         fit: BoxFit.cover)),
          child: SingleChildScrollView(
            padding: Paddings.tinyAllSides,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(
                height: 50,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(HugeIcons.strokeRoundedCoins01,
                            color: Colors.black, size: 20),
                        Spaces.tinySideSpace,
                        Text('Bill Reminder', style: Blacks.regularSemiRoboto)
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.pushNamed(context, Routes.addBill);
                      },
                      child: Icon(Icons.add_box_rounded,
                          color: HexColor('#EE7D13')),
                    )
                  ],
                ),
              ),
              Spaces.smallTopSpace,
              // Favourites Section
              FavouritesSection<Bill>(
                  title: "Favourite Bills",
                  items: favouriteBills,
                  onAdd: () => Navigator.pushNamed(context, Routes.addBill),
                  emptyHint: 'Save frequently used bills for quick access',
                  onItemSelected: (bill) {
                    Navigator.pushNamed(context, Routes.lipaNaMpesa);
                  },
                  itemBuilder: (bill) {
                    return BillItem(bill: bill);
                  }),
              Spaces.smallTopSpace,

              // New Sections Added Below
              BillsCategorySection(title: "My Bills", bills: myBills),
              Spaces.smallTopSpace,
              BillsCategorySection(title: "Home Bills", bills: homeBills),
              Spaces.smallTopSpace,
              BillsCategorySection(title: "Other Bills", bills: otherBills),
              Spaces.smallTopSpace,
            ]),
          ),
        ),
      ),
    );
  }
}

// Reusable widget for displaying a category of bills.
class BillsCategorySection extends StatelessWidget {
  final String title;
  final List<Bill> bills;

  const BillsCategorySection({
    super.key,
    required this.title,
    required this.bills,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Blacks.smallestBolderPoppins),
        Spaces.smallTopSpace,
        if (bills.isEmpty)
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'You have no bills in this category yet.',
              style: Grays.regularPoppins,
            ),
          )
        else
          SizedBox(
            height: 80,
            width: size.width,
            child: ListView.builder(
              padding: Paddings.tinyHorizontal,
              shrinkWrap: true,
              scrollDirection: Axis.horizontal,
              itemCount: bills.length,
              itemBuilder: (context, index) {
                final bill = bills[index];
                return GestureDetector(
                  onTap: () {
                    Fluttertoast.cancel();
                    Fluttertoast.showToast(msg: 'pay for ${bill.name}');
                  },
                  child: BillItem(bill: bill),
                );
              },
            ),
          ),
      ],
    );
  }
}

// Reusable widget for displaying a single bill item.
class BillItem extends StatelessWidget {
  final Bill bill;
  const BillItem({super.key, required this.bill});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: Paddings.tinyHorizontal,
      width: 60,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: HexColor(AppColors.primaryGreen),
            ),
            child: Icon(bill.icon, color: Colors.white),
          ),
          Spaces.tinyTopSpace,
          Text(
            bill.name,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12),
          )
        ],
      ),
    );
  }
}
