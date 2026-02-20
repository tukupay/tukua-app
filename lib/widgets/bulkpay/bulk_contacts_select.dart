import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/routes.dart';
import '../../providers/providers.dart';
import '../../constants/constants.dart';
import '../../widgets/widget.dart';
import '../../models/models.dart';


class BulkContactsSelect extends StatefulWidget {
  const BulkContactsSelect({super.key});

  @override
  State<BulkContactsSelect> createState() => _BulkContactsSelectState();
}

class _BulkContactsSelectState extends State<BulkContactsSelect> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<BulkPayProvider, ContactsProvider, DeviceContactProvider>(
      builder: (_, bulkPay, contactProvider, deviceContactProvider, __) {
        // If a group is selected, show group contacts
        if (bulkPay.selectedGroup != null) {
          if (bulkPay.loadingContacts) {
            return _buildLoadingShimmer();
          }
          if (bulkPay.groupContacts?.contacts?.isNotEmpty ?? false) {
            return _buildGroupContactsList(context, bulkPay.groupContacts!);
          } else {
            return _buildEmptyGroupState(context, bulkPay.selectedGroup!);
          }
        }

        // Device contacts states
        if (deviceContactProvider.isLoading && deviceContactProvider.filteredContacts.isEmpty) {
          return _buildLoadingShimmer();
        }

        if (deviceContactProvider.filteredContacts.isEmpty && !deviceContactProvider.isLoading) {
          return _buildEmptyState();
        }

        // Show contacts list with search
        return _buildAllContactsList(context, deviceContactProvider);
      },
    );
  }

  Widget _buildLoadingShimmer() {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 8,
      itemBuilder: (context, index) => const ContactCardShimmer(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(HugeIcons.strokeRoundedContact, size: 48, color: HexColor(AppColors.lightGray)),
          const SizedBox(height: 12),
          Text("No contacts found", style: Grays.mediumPoppins),
        ],
      ),
    );
  }

  Widget _buildEmptyGroupState(BuildContext context, ContactGroupResponse group) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: Paddings.smallVertical,
        child: RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            text: "This group has no contacts.  ",
            style: Grays.regularSemiInter,
            children: [
              TextSpan(
                text: "Add contacts to this group.",
                style: Greens.regularSemiRoboto,
                recognizer: TapGestureRecognizer()
                  ..onTap = () {
                    Provider.of<ContactsProvider>(context, listen: false).selectGroup(group);
                    Navigator.pushNamed(context, Routes.contactGroupMembers);
                  },
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Builds the list for "all contacts" using virtualized ListView
  Widget _buildAllContactsList(BuildContext context, DeviceContactProvider deviceContactProvider) {
    final contacts = deviceContactProvider.filteredContacts;

    return Column(
      children: [
        // Search field - fixed at top
        AuthTextField(
          controller: _searchController,
          hint: 'Search ${deviceContactProvider.simpleContacts.length} contacts',
          changed: (val) {
            deviceContactProvider.searchContacts(val);
          },
        ),
        const SizedBox(height: 8),
        // Virtualized contacts list
        Expanded(
          child: ListView.builder(
            // Allow scrolling inside NestedScrollView body
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: contacts.length,
            padding: const EdgeInsets.only(top: 4, bottom: 80),
            itemBuilder: (context, index) {
              final contact = contacts[index];
              return ContactSelectCard(contact: contact, index: index);
            },
          ),
        ),
      ],
    );
  }

  /// Builds the list for contacts within a selected group
  Widget _buildGroupContactsList(BuildContext context, FullGroup group) {
    return ListView.builder(
      // Allow scrolling inside NestedScrollView body
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: group.contactCount ?? 0,
      padding: const EdgeInsets.only(top: 4, bottom: 80),
      itemBuilder: (context, index) {
        final contact = group.contacts![index];
        return MemberSelectCard(contact: BulkPayContact(contact: contact));
      },
    );
  }
}