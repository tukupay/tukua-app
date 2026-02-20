import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

/// Bottom sheet for inviting new signatory or editing existing one
class SignatoryFormSheet extends StatefulWidget {
  final int walletId;
  final WalletSignatory? existingSignatory; // null for new invite
  final VoidCallback? onSuccess;

  const SignatoryFormSheet({
    super.key,
    required this.walletId,
    this.existingSignatory,
    this.onSuccess,
  });

  /// Show the form sheet
  static Future<void> show(
    BuildContext context, {
    required int walletId,
    WalletSignatory? existingSignatory,
    VoidCallback? onSuccess,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SignatoryFormSheet(
        walletId: walletId,
        existingSignatory: existingSignatory,
        onSuccess: onSuccess,
      ),
    );
  }

  @override
  State<SignatoryFormSheet> createState() => _SignatoryFormSheetState();
}

class _SignatoryFormSheetState extends State<SignatoryFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  String _selectedRole = 'signatory';

  bool get isEditing => widget.existingSignatory != null;

  final List<Map<String, dynamic>> _roles = [
    {
      'value': 'admin',
      'label': 'Admin',
      'icon': HugeIcons.strokeRoundedUserStar01,
      'description': 'Full access to manage wallet',
    },
    {
      'value': 'signatory',
      'label': 'Signatory',
      'icon': HugeIcons.strokeRoundedUserCheck01,
      'description': 'Can approve transactions',
    },
    {
      'value': 'viewer',
      'label': 'Viewer',
      'icon': HugeIcons.strokeRoundedView,
      'description': 'Can only view wallet details',
    },
  ];

  @override
  void initState() {
    super.initState();
    if (isEditing) {
      _nameController.text = widget.existingSignatory!.fullName;
      _phoneController.text = widget.existingSignatory!.phoneNumber;
      _emailController.text = widget.existingSignatory?.email ?? '';
      _selectedRole = widget.existingSignatory!.role.toLowerCase();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  // Validate form fields
  String? _validateForm() {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();

    if (name.isEmpty) {
      return 'Full name is required';
    }

    // Either phone or valid email must be provided
    final hasPhone = phone.isNotEmpty;
    final hasValidEmail = email.isNotEmpty &&
        RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);

    if (!hasPhone && !hasValidEmail) {
      return 'Please provide a valid phone number or email address';
    }

    return null; // Validation passed
  }

  Future<void> _submit() async {
    // Custom validation
    final validationError = _validateForm();
    if (validationError != null) {
      Fluttertoast.cancel();
      Fluttertoast.showToast(msg: validationError);
      return;
    }

    // Capture values before popping (context becomes invalid after pop)
    final navigator = Navigator.of(context);
    final provider = Provider.of<SignatoryProvider>(context, listen: false);
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();

    navigator.pop(); // Close sheet

    // Show loading
    showAdaptiveDialog(
      context: navigator.context,
      barrierDismissible: false,
      builder: (ctx) => AiAnalysisAlert(
        icon: isEditing
            ? HugeIcons.strokeRoundedUserEdit01
            : HugeIcons.strokeRoundedUserAdd01,
        action: isEditing ? 'Updating Signatory' : 'Inviting Signatory',
      ),
    );

    final request = SignatoryRequest(
      fullName: name,
      phoneNumber: phone,
      email: email,
      role: _selectedRole,
    );

    if (isEditing) {
      await provider.updateDetails(
        widget.walletId,
        widget.existingSignatory!.id,
        request,
      );
    } else {
      await provider.inviteSignatory(widget.walletId, request);
    }

    navigator.pop(); // Pop loading

    // Show result
    final hasError = isEditing ? provider.updating : provider.inviting;
    final response = isEditing ? provider.updateResponse : provider.inviteResponse;

    if (response?.error == null && !hasError) {
      widget.onSuccess?.call();
      _showResultDialogWithNavigator(
        navigator: navigator,
        success: true,
        title: isEditing ? 'Signatory Updated' : 'Invitation Sent',
        message: isEditing
            ? '$name details have been updated.'
            : 'An invitation has been sent to $name.',
      );
    } else {
      _showResultDialogWithNavigator(
        navigator: navigator,
        success: false,
        title: 'Operation Failed',
        message: response?.error ?? 'Something went wrong. Please try again.',
      );
    }
  }

  void _showResultDialogWithNavigator({
    required NavigatorState navigator,
    required bool success,
    required String title,
    required String message,
  }) {
    showGeneralDialog(
      context: navigator.context,
      pageBuilder: (context, anim1, anim2) => const SizedBox(),
      transitionDuration: const Duration(milliseconds: 400),
      transitionBuilder: (context, anim1, anim2, child) {
        return SlideTransition(
          position: Tween(
            begin: const Offset(1, 0),
            end: const Offset(0, 0),
          ).animate(anim1),
          child: SuccessAlert(
            icon: success
                ? HugeIcons.strokeRoundedCheckmarkCircle01
                : HugeIcons.strokeRoundedAlertCircle,
            title: title,
            content: message,
            tapped: () => Navigator.pop(context),
            anim1: anim1,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(bottom: bottomPadding),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Spaces.mediumTopSpace,

                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isEditing
                            ? HugeIcons.strokeRoundedUserEdit01
                            : HugeIcons.strokeRoundedUserAdd01,
                        color: HexColor(AppColors.primaryGreen),
                        size: 24,
                      ),
                    ),
                    Spaces.smallSideSpace,
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isEditing ? 'Edit Signatory' : 'Invite Signatory',
                            style: Blacks.mediumSemiPoppins,
                          ),
                          Text(
                            isEditing
                                ? 'Update signatory details or role'
                                : 'Add a new signatory to this wallet',
                            style: Grays.smallestPoppinsHint,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(
                        HugeIcons.strokeRoundedCancel01,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                Spaces.mediumTopSpace,

                // Full Name
                LabeledField(
                  label: 'Full Name',
                  hint: 'Enter full name',
                  enabled: true,
                  controller: _nameController,
                ),
                Spaces.smallTopSpace,

                // Phone Number
                LabeledField(
                  label: 'Phone Number',
                  hint: '254XXXXXXXXX',
                  enabled: !isEditing, // Phone can't be changed when editing
                  controller: _phoneController,
                  isNumber: true,
                  prefixIcon: Icon(
                    HugeIcons.strokeRoundedCall,
                    color: Colors.grey.shade600,
                    size: 20,
                  ),
                ),
                Spaces.smallTopSpace,

                // Email
                LabeledField(
                  label: 'Email Address',
                  hint: 'email@example.com',
                  enabled: true,
                  controller: _emailController,
                  prefixIcon: Icon(
                    HugeIcons.strokeRoundedMail01,
                    color: Colors.grey.shade600,
                    size: 20,
                  ),
                ),
                Spaces.mediumTopSpace,

                // Role Selection
                Text('Select Role', style: Grays.smallestBolderPoppinsHint),
                Spaces.tinyTopSpace,
                ...List.generate(_roles.length, (index) {
                  final role = _roles[index];
                  final isSelected = _selectedRole == role['value'];

                  return GestureDetector(
                    onTap: () => setState(() => _selectedRole = role['value']),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.1)
                            : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? HexColor(AppColors.primaryGreen)
                              : Colors.grey.shade300,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? HexColor(AppColors.primaryGreen).withValues(alpha: 0.2)
                                  : Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              role['icon'],
                              color: isSelected
                                  ? HexColor(AppColors.primaryGreen)
                                  : Colors.grey.shade600,
                              size: 20,
                            ),
                          ),
                          Spaces.smallSideSpace,
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  role['label'],
                                  style: isSelected
                                      ? Greens.regularSemiRoboto
                                      : Blacks.regularBoldCodeNext,
                                ),
                                Text(
                                  role['description'],
                                  style: Grays.smallestPoppinsHint,
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            Icon(
                              HugeIcons.strokeRoundedCheckmarkCircle02,
                              color: HexColor(AppColors.primaryGreen),
                              size: 22,
                            ),
                        ],
                      ),
                    ),
                  );
                }),

                Spaces.mediumTopSpace,

                // Submit Button
                AuthButton(
                  text: isEditing ? 'UPDATE SIGNATORY' : 'SEND INVITATION',
                  tapped: _submit,
                ),
                Spaces.smallTopSpace,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

