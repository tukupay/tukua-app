import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/widgets/contacts/contacts.dart';
import 'package:tuku/providers/providers.dart';
import '../../models/models.dart';

/// Contact selection card for BulkSMS
/// Uses the shared SelectableContactCard component
class ContactCard extends StatelessWidget {
  final DeviceContact contact;
  final int index;
  const ContactCard({
    super.key,
    required this.contact,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<BulkSmsProvider>(
      builder: (_, bulkSms, __) {
        return SelectableContactCard(
          contact: contact,
          index: index,
          isSelected: bulkSms.selectedContacts.contains(contact),
          onToggle: () {
            Provider.of<BulkSmsProvider>(context, listen: false)
                .selectContact(contact);
          },
          showSelectLabel: true,
        );
      },
    );
  }
}
