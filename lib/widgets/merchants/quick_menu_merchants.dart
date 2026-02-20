import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/merchant_provider.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/home/menu_card.dart';
import 'package:tuku/widgets/merchants/quick_menu_merchant_item.dart';

/// Widget to display quick menu merchants on the home page
/// Uses the same MenuCard style as InstantPay and Tools
class QuickMenuMerchants extends StatelessWidget {
  const QuickMenuMerchants({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<MerchantProvider>(
      builder: (context, merchantProvider, _) {
        final quickMenuMerchants = merchantProvider.quickMenuMerchants;

        // Don't show if no merchants in quick menu
        if (quickMenuMerchants.isEmpty) {
          return const SizedBox.shrink();
        }

        return Padding(
          padding: EdgeInsetsGeometry.only(
            top: 20
          ),
          child: MenuCard(
            title: 'Favourite Merchants',
            child: ListView(
              scrollDirection: Axis.horizontal,
              shrinkWrap: true,
              children: quickMenuMerchants.map((merchant) {
                return QuickMenuMerchantItem(
                  merchant: merchant,
                  onTap: () {
                    // Navigate to the merchant's route
                    Navigator.pushNamed(context, Routes.myChurch,
                    );
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}

