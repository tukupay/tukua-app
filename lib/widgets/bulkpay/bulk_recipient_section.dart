import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

/// Recipient type section with manual phone number input option
class BulkRecipientSection extends StatelessWidget {
  const BulkRecipientSection({super.key});

  void _showManualInputSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const ManualPhoneInputSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: GlassMorphism.standard(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: HexColor('#E8F5E9'),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(HugeIcons.strokeRoundedUserMultiple02,
                    size: 18, color: HexColor(AppColors.primaryGreen)),
              ),
              const SizedBox(width: 12),
              Text('Select Recipients', style: Blacks.tinyBolderPoppins),
              const Spacer(),
              // Manual Input Button
              GestureDetector(
                onTap: () => _showManualInputSheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: HexColor('#E3F2FD'),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: HexColor('#2196F3').withAlpha(76)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedKeyboard,
                        size: 14,
                        color: HexColor('#2196F3'),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Manual',
                        style: TextStyle(
                          color: HexColor('#2196F3'),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const BulkPayRecipientType(),
        ],
      ),
    );
  }
}

/// Manual phone number input bottom sheet
class ManualPhoneInputSheet extends StatefulWidget {
  const ManualPhoneInputSheet({super.key});

  @override
  State<ManualPhoneInputSheet> createState() => _ManualPhoneInputSheetState();
}

class _ManualPhoneInputSheetState extends State<ManualPhoneInputSheet> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _phoneNumbers = [];
  String? _errorMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _addPhoneNumber(String input) {
    setState(() {
      _errorMessage = null;
    });

    // Handle comma-separated input
    List<String> numbers = input.contains(',')
        ? input.split(',').map((e) => e.trim()).toList()
        : [input.trim()];

    for (String number in numbers) {
      if (number.isEmpty) continue;

      // Remove any non-digit characters except leading +
      String cleaned = number.replaceAll(RegExp(r'[^\d+]'), '');

      // Validate phone number (10 digits or starts with +254 and has 12 digits)
      if (_isValidPhoneNumber(cleaned)) {
        // Format to standard format
        String formatted = _formatPhoneNumber(cleaned);

        if (!_phoneNumbers.contains(formatted)) {
          setState(() {
            _phoneNumbers.add(formatted);
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Invalid phone number format. Use 10 digits (e.g., 0712345678)';
        });
        return;
      }
    }

    _controller.clear();
  }

  bool _isValidPhoneNumber(String number) {
    // Accept 10 digits starting with 0
    if (RegExp(r'^0\d{9}$').hasMatch(number)) {
      return true;
    }
    // Accept +254 followed by 9 digits
    if (RegExp(r'^\+254\d{9}$').hasMatch(number)) {
      return true;
    }
    // Accept 254 followed by 9 digits
    if (RegExp(r'^254\d{9}$').hasMatch(number)) {
      return true;
    }
    return false;
  }

  String _formatPhoneNumber(String number) {
    // Convert to standard format: 0XXXXXXXXX
    if (number.startsWith('+254')) {
      return '0${number.substring(4)}';
    } else if (number.startsWith('254')) {
      return '0${number.substring(3)}';
    }
    return number;
  }

  void _removePhoneNumber(int index) {
    setState(() {
      _phoneNumbers.removeAt(index);
    });
  }

  void _confirmSelection() {
    if (_phoneNumbers.isEmpty) {
      setState(() {
        _errorMessage = 'Please add at least one phone number';
      });
      return;
    }

    // Add phone numbers to BulkPayProvider
    final bulkPayProvider = Provider.of<BulkPayProvider>(context, listen: false);
    bulkPayProvider.addManualPhoneNumbers(_phoneNumbers);

    // Show success toast
    Fluttertoast.showToast(
      msg: '${_phoneNumbers.length} number${_phoneNumbers.length != 1 ? 's' : ''} added',
      toastLength: Toast.LENGTH_SHORT,
    );

    // Navigate to view and set amounts
    Navigator.pop(context);
    Navigator.pushNamed(context, Routes.selectContacts);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: HexColor('#E0E0E0'),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Title
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: HexColor('#E3F2FD'),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedKeyboard,
                  color: HexColor('#2196F3'),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text('Manual Input', style: Blacks.regularBoldCodeNext),
            ],
          ),
          const SizedBox(height: 8),

          // Instructions
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: HexColor('#FFF9E6'),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: HexColor('#FFE082')),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  HugeIcons.strokeRoundedInformationCircle,
                  color: HexColor('#F57C00'),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Enter phone numbers separated by commas or press Enter after each number',
                    style: TextStyle(
                      color: HexColor('#5D4037'),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Input field
          TextField(
            controller: _controller,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              hintText: '0712345678',
              hintStyle: Grays.smallestPoppinsHint,
              prefixIcon: Icon(
                HugeIcons.strokeRoundedSmartPhone01,
                color: HexColor(AppColors.primaryGreen),
                size: 20,
              ),
              suffixIcon: IconButton(
                icon: Icon(
                  HugeIcons.strokeRoundedAdd01,
                  color: HexColor(AppColors.primaryGreen),
                ),
                onPressed: () {
                  if (_controller.text.trim().isNotEmpty) {
                    _addPhoneNumber(_controller.text);
                  }
                },
              ),
              filled: true,
              fillColor: HexColor('#F8FAF9'),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: HexColor('#E8ECE9')),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: HexColor('#E8ECE9')),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: HexColor(AppColors.primaryGreen),
                  width: 2,
                ),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.red, width: 1),
              ),
              errorText: _errorMessage,
            ),
            onSubmitted: (value) {
              if (value.trim().isNotEmpty) {
                _addPhoneNumber(value);
              }
            },
          ),
          const SizedBox(height: 16),

          // Phone numbers list
          if (_phoneNumbers.isNotEmpty) ...[
            Text(
              '${_phoneNumbers.length} Number${_phoneNumbers.length != 1 ? 's' : ''} Added',
              style: Blacks.smallestBoldPoppins,
            ),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 200),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: HexColor('#E8ECE9')),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(8),
                  itemCount: _phoneNumbers.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: HexColor('#E8F5E9'),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: HexColor(AppColors.primaryGreen).withAlpha(51),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            HugeIcons.strokeRoundedSmartPhone01,
                            color: HexColor(AppColors.primaryGreen),
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _phoneNumbers[index],
                              style: Blacks.smallestBoldPoppins,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _removePhoneNumber(index),
                            child: Icon(
                              HugeIcons.strokeRoundedDelete02,
                              color: Colors.red[400],
                              size: 18,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(color: HexColor(AppColors.darkerGray2)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Cancel',
                    style: TextStyle(
                      color: HexColor(AppColors.darkerGray2),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _confirmSelection,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: HexColor(AppColors.primaryGreen),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(HugeIcons.strokeRoundedCheckmarkCircle01, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Confirm (${_phoneNumbers.length})',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      ),
    );
  }
}
