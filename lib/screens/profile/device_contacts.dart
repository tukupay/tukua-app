import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class DeviceContacts extends StatefulWidget {
  const DeviceContacts({super.key});

  @override
  State<DeviceContacts> createState() => _DeviceContactsState();
}

class _DeviceContactsState extends State<DeviceContacts> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() {
      Provider.of<DeviceContactProvider>(context, listen: false)
          .searchContacts(_searchController.text);
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text("Device Contacts", style: Blacks.mediumSemiRubik),
        actions: [
          NotificationsBell(),
          Spaces.smallSideSpace,
        ],
      ),
      body: Container(
        padding: Paddings.tinyAllSides,
        child: Consumer2<DeviceContactProvider, ContactsProvider>(
            builder: (_, deviceContacts, contactProvider, __) {
          // Permission not requested yet: show initial permission request UI
          if (!deviceContacts.permissionChecked) {
            return _buildPermissionRequestUI(context, deviceContacts);
          }

          // Permission denied
          if (!deviceContacts.permissionGranted) {
            return _buildPermissionDeniedUI();
          }

          // Permission granted - show contacts UI (partial results allowed while loading)
          return _buildContactListUI(context, size, deviceContacts, contactProvider);
        }),
      ),
    );
  }

  Widget _buildPermissionRequestUI(BuildContext context, DeviceContactProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
           Text("Sync contacts from your device to quickly add them.",
          style: Grays.regularDarkerSemiInter,textAlign: TextAlign.center),
          Spaces.mediumTopSpace,
          ElevatedButton(
            onPressed: () async {
              await provider.requestAndFetchContacts();
            },
            child: const Text('Sync Contacts'),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionDeniedUI() {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 24.0),
        child: Text(
          "Contact permission was denied. Please go to your app settings to enable it.",
          textAlign: TextAlign.center,
          style: Grays.regularDarkerSemiInter,
        ),
      ),
    );
  }

  Widget _buildContactListUI(BuildContext context, Size size, DeviceContactProvider deviceContacts, ContactsProvider contactProvider) {
    return Column(
      children: [
        // Show a progress bar when loading; allow partial results below it
        if (deviceContacts.isLoading)
          Column(
            children: [
              LinearProgressIndicator(
                value: deviceContacts.fetchProgress > 0 ? deviceContacts.fetchProgress / 100 : null,
                minHeight: 4.0,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(HexColor(AppColors.primaryGreen)),
              ),
              SizedBox(height: 8),
              Text(deviceContacts.fetchProgress < 100 ? 'Syncing contacts... ${deviceContacts.fetchProgress}%': 'Finalizing...', style: Grays.tinyPoppinsHint),
              Spaces.smallTopSpace,
            ],
          ),
        AuthTextField(
            controller: _searchController,
            hint: 'Search ${deviceContacts.filteredContacts.length} Contacts',
            obscure: false,
            obscureIcon: Icons.search),
        Spaces.smallTopSpace,
        Expanded(
          child: deviceContacts.filteredContacts.isEmpty && _searchController.text.isNotEmpty
              ? const Center(
                  child: Text('No results found.'),
                )
              : deviceContacts.filteredContacts.isEmpty
                  ? Center(
                      child: deviceContacts.isLoading
                          ? Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const CircularProgressIndicator(),
                                Spaces.tinyTopSpace,
                                Text('Preparing contacts...', style: Grays.tinyPoppinsHint),
                              ],
                            )
                          : const Text('No contacts available.'),
                    )
                  : ListView.separated(
                      itemCount: deviceContacts.filteredContacts.length,
                      separatorBuilder: (context, index) => Container(
                          height: 0.5,
                          width: size.width,
                          decoration: BoxDecoration(
                              border: Border.all(color: HexColor(AppColors.lightGray)))),
                      itemBuilder: (context, index) {
                        DeviceContact contact = deviceContacts.filteredContacts[index];
                        return GestureDetector(
                          onTap: () {
                            showAdaptiveDialog(
                                context: context,
                                builder: (context) => ConfirmAlert(
                                    text: "Add ${contact.fullName}?",
                                    pressed: () async {
                                      final request = ContactRequest(
                                          name: contact.fullName,
                                          phone: contact.phoneNumber,
                                          groupId: contactProvider.selectedGroup!.id!);
                                      await Provider.of<ContactsProvider>(context, listen: false)
                                          .createContact(request, context);
                                    }));
                          },
                          child: Container(
                            width: size.width,
                            padding: Paddings.tinyVertical,
                            child: Row(
                              children: [
                                Container(
                                  padding: Paddings.tinyAllSides,
                                  decoration: BoxDecoration(
                                      color: HexColor(AppColors.primaryGreen),
                                      shape: BoxShape.circle),
                                  child: Text(createInitials(contact.fullName),
                                      style: Whites.regularGrotesk),
                                ),
                                Spaces.smallSideSpace,
                                Expanded(
                                    child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(contact.fullName,
                                        style: Blacks.regularBoldCodeNext),
                                    Text(contact.phoneNumber ?? '-',
                                        style: Blacks.smallestBolderPoppins)
                                  ],
                                ))
                              ],
                            ),
                          ),
                        );
                      }),
        )
      ],
    );
  }
}