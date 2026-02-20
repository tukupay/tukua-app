import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/widgets/contacts/contacts.dart';
import '../../providers/providers.dart';

/// Contact selection card for BulkPay
/// Uses the shared SelectableContactCard component
class ContactSelectCard extends StatelessWidget {
  final int index;
  final DeviceContact contact;
  const ContactSelectCard({super.key,
  required this.index, required this.contact});

  @override
  Widget build(BuildContext context) {
    return Consumer<BulkPayProvider>(
      builder: (_, bulkPay, __) {
        return SelectableContactCard(
          index: index,
          contact: contact,
          showSelectLabel: true,
          isSelected: bulkPay.isDeviceContactSelected(contact),
          onToggle: () {
            Provider.of<BulkPayProvider>(context, listen: false)
                .toggleDeviceContact(contact);
          },
        );
      },
    );
  }
}
