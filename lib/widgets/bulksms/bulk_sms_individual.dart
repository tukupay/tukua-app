import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
import '../../models/models.dart';

class BulkSmsIndividual extends StatelessWidget {
  const BulkSmsIndividual({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<DeviceContactProvider>(
      builder: (_, deviceContact, __) {
        if (deviceContact.isLoading) {
          return ListView.builder(
              // allow scrolling inside tab view
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: 5,
              itemBuilder: (context, index) {
                return const ContactCardShimmer();
              });
        }

        if (!deviceContact.permissionChecked) {
          return _buildPermissionRequestUI(context, deviceContact);
        }

        if (!deviceContact.permissionGranted) {
          return _buildPermissionDeniedUI();
        }

        if (deviceContact.simpleContacts.isEmpty) {
          return emptyContacts();
        }

        return ListView.builder(
            // make this scrollable; TabBarView gives it height via parent Expanded
            physics: const NeverScrollableScrollPhysics(),
            itemCount: deviceContact.filteredContacts.length,
            padding: Paddings.tinyVertical,
            itemBuilder: (context, index) {
              DeviceContact contact = deviceContact.filteredContacts[index];
              return ContactCard(contact: contact, index: index);
            });
      },
    );
  }
}

Widget _buildPermissionRequestUI(
    BuildContext context, DeviceContactProvider provider) {
  return SingleChildScrollView(
    physics: const AlwaysScrollableScrollPhysics(),
    child: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Spaces.mediumTopSpace,
          Text("Sync contacts from your device to quickly send SMS.",
              style: Grays.regularDarkerSemiInter, textAlign: TextAlign.center),
          Spaces.mediumTopSpace,
          ElevatedButton(
            onPressed: () async {
              await provider.requestAndFetchContacts();
            },
            child: const Text('Sync Contacts'),
          ),
        ],
      ),
    ),
  );
}


Widget _buildPermissionDeniedUI() {
  return SingleChildScrollView(
    physics: const AlwaysScrollableScrollPhysics(),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 48.0),
      child: Text(
        "Contact permission was denied. Please go to your app settings to enable it.",
        textAlign: TextAlign.center,
        style: Grays.regularDarkerSemiInter,
      ),
    ),
  );
}

Widget emptyContacts() {
  return SingleChildScrollView(
    physics: const AlwaysScrollableScrollPhysics(),
    child: Column(
      children: [
        Spaces.mediumTopSpace,
        Icon(HugeIcons.strokeRoundedContact,
            size: 45, color: HexColor(AppColors.lightGray)),
        Spaces.tinyTopSpace,
        Text("No contacts found", style: Grays.mediumPoppins),
      ],
    ),
  );
}
