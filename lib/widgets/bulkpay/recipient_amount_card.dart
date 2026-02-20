import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';

class RecipientAmountCard extends StatefulWidget {
  final BulkPayContact contact;
  final int index;
  final bool? showIndex;
  final int? amount;
  final bool? inputEnabled;
  const RecipientAmountCard({
    super.key,
    required this.contact,
    required this.index,
    this.showIndex,
    this.amount,
    this.inputEnabled,
  });

  @override
  State<RecipientAmountCard> createState() => _RecipientAmountCardState();
}

class _RecipientAmountCardState extends State<RecipientAmountCard> {
  late final TextEditingController _amountController;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController();
    if (widget.amount != null && widget.amount! > 0) {
      _amountController.text = widget.amount.toString();
    }
  }

  @override
  void didUpdateWidget(covariant RecipientAmountCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newAmountStr = widget.amount?.toString() ?? '';
    if (newAmountStr != _amountController.text) {
      if (newAmountStr == '0') {
        _amountController.clear();
      } else {
        _amountController.text = newAmountStr;
      }
      // Move cursor to the end after programmatic change
      _amountController.selection =
          TextSelection.fromPosition(TextPosition(offset: _amountController.text.length));
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  // Check if this is a manually added contact (deviceContact with phone == fullName)
  bool _isManualEntry() {
    return widget.contact.deviceContact != null &&
        widget.contact.deviceContact!.phoneNumber == widget.contact.deviceContact!.fullName;
  }

  void _showEditPhoneDialog(BuildContext context, BulkPayProvider bulkPay) {
    final TextEditingController phoneController = TextEditingController(
      text: widget.contact.phone,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit Phone Number', style: Blacks.regularBoldGrotesk),
        content: TextField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            hintText: '0712345678',
            hintStyle: Grays.smallestPoppinsHint,
            prefixIcon: Icon(
              HugeIcons.strokeRoundedSmartPhone01,
              color: HexColor(AppColors.primaryGreen),
              size: 20,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: HexColor(AppColors.primaryGreen),
                width: 2,
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: Grays.tinyPoppinsHint),
          ),
          ElevatedButton(
            onPressed: () {
              final newPhone = phoneController.text.trim();
              if (newPhone.isNotEmpty && _validatePhoneNumber(newPhone)) {
                bulkPay.updateManualPhoneNumber(widget.index, newPhone);
                Navigator.pop(context);
                Fluttertoast.showToast(msg: 'Phone number updated');
              } else {
                Fluttertoast.showToast(
                  msg: 'Invalid phone number',
                  backgroundColor: Colors.red,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: HexColor(AppColors.primaryGreen),
            ),
            child: const Text('Update', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  bool _validatePhoneNumber(String number) {
    String cleaned = number.replaceAll(RegExp(r'[^\d+]'), '');
    if (RegExp(r'^0\d{9}$').hasMatch(cleaned)) return true;
    if (RegExp(r'^\+254\d{9}$').hasMatch(cleaned)) return true;
    if (RegExp(r'^254\d{9}$').hasMatch(cleaned)) return true;
    return false;
  }

  void _confirmDelete(BuildContext context, BulkPayProvider bulkPay) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Remove Contact?', style: Blacks.regularBoldGrotesk),
        content: Text(
          'Are you sure you want to remove ${widget.contact.phone}?',
          style: Blacks.smallestBoldPoppins,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: Grays.tinyPoppinsHint),
          ),
          ElevatedButton(
            onPressed: () {
              bulkPay.removeContactAtIndex(widget.index);
              Navigator.pop(context);
              Fluttertoast.showToast(msg: 'Contact removed');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Remove', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Consumer<BulkPayProvider>(builder: (_, bulkPay, __) {
      final bool isSelected = bulkPay.selectedContacts.contains(widget.contact);
      final bool isEnabled = widget.inputEnabled == false
          ? false
          : !bulkPay.sameAmount && isSelected;

      return Container(
        padding: Paddings.tinyVertical,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            if (widget.showIndex == true)
              Text('${widget.index + 1}. ', style: Blacks.regularBoldGrotesk)
            else
              Checkbox(
                  fillColor: WidgetStatePropertyAll(HexColor(AppColors.lightGray)),
                  checkColor: HexColor(AppColors.primaryOrange),
                  value: isSelected,
                  onChanged: (val) {
                    Provider.of<BulkPayProvider>(context, listen: false)
                        .selectContact(widget.contact);
                  }),
            Container(
              height: 50,
              width: 50,
              decoration: BoxDecoration(
                color: HexColor(AppColors.primaryOrange),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(createInitials(widget.contact.name),
                  style: Blacks.regularBoldGrotesk),
            ),
            Spaces.smallSideSpace,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.contact.name, style: Blacks.regularSemiRoboto),
                  Row(
                    children: [
                      Expanded(
                        child: Text(widget.contact.phone!, style: Grays.tinyPoppinsHint),
                      ),
                      // Show edit/delete buttons for manual entries when in amount page
                      if (widget.showIndex == true && _isManualEntry()) ...[
                        GestureDetector(
                          onTap: () => _showEditPhoneDialog(context, bulkPay),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            child: Icon(
                              HugeIcons.strokeRoundedEdit02,
                              size: 14,
                              color: HexColor('#2196F3'),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => _confirmDelete(context, bulkPay),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            child: const Icon(
                              HugeIcons.strokeRoundedDelete02,
                              size: 14,
                              color: Colors.red,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Spaces.smallSideSpace,
            SizedBox(
                height: 35,
                width: size.width / 4,
                child: TextFormField(
                  controller: _amountController,
                  enabled: isEnabled,
                  maxLines: 1,
                  onChanged: (val) {
                    final amount = int.tryParse(val) ?? 0;
                    Provider.of<BulkPayProvider>(context, listen: false)
                        .setAmount(widget.contact, amount);
                  },
                  textAlign: TextAlign.center,
                  textInputAction: TextInputAction.done,
                  keyboardType: TextInputType.number,
                  style: isEnabled ? Blacks.regularKarla : Grays.tinyPoppinsHint,
                  cursorHeight: 15,
                  cursorColor: HexColor('#15411D'),
                  decoration: InputDecoration(
                      hintText: 'ksh amount',
                      hintStyle: Grays.tinySemiKarla,
                      filled: !isEnabled,
                      fillColor: Colors.grey[200],
                      disabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.grey.shade300)),
                      enabledBorder: const OutlineInputBorder(),
                      border: const OutlineInputBorder(),
                      focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: HexColor('#15411D'))),
                      errorBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: Colors.redAccent))),
                )),
          ],
        ),
      );
    });
  }
}
