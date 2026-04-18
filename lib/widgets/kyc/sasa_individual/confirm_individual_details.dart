import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/models/sasapay/onboarding/customer_init_request.dart';

import '../../../constants/constants.dart';


class ConfirmIndividualDetails extends StatelessWidget {
  const ConfirmIndividualDetails({super.key});

  // Mock KYC data – will be replaced with actual provider data after API integration
  CustomerInitRequest get _mockRequest => CustomerInitRequest(
    firstName: 'John',
    middleName: 'Kamau',
    lastName: 'Mwangi',
    countryCode: '254',
    documentType: '1',
    documentNumber: '32456789',
    email: 'john.mwangi@email.com',
  );

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final request = _mockRequest;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Header illustration
          Container(
            height: 80,
            width: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  HexColor(AppColors.primaryGreen).withAlpha(25),
                  HexColor(AppColors.fadedGreen).withAlpha(40),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Icon(
              HugeIcons.strokeRoundedUserCheck01,
              size: 36,
              color: HexColor(AppColors.fadedGreen),
            ),
          ),
          Spaces.smallTopSpace,
          Text('Confirm Your Details',
              style: Blacks.tinyBolderPoppins),
          const SizedBox(height: 4),
          Padding(
            padding: Paddings.mediumHorizontal,
            child: Text(
              'These details from your KYC will be submitted to SasaPay for wallet creation.',
              style: Grays.tinyPoppinsHint,
              textAlign: TextAlign.center,
            ),
          ),
          Spaces.mediumTopSpace,

          // Details card
          Container(
            width: size.width,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            decoration: GlassMorphism.greenTinted(borderRadius: 18),
            child: Column(
              children: [
                _DetailRow(
                  icon: HugeIcons.strokeRoundedUser,
                  label: 'First Name',
                  value: request.firstName,
                ),
                _DetailRow(
                  icon: HugeIcons.strokeRoundedUser,
                  label: 'Middle Name',
                  value: request.middleName ?? '—',
                ),
                _DetailRow(
                  icon: HugeIcons.strokeRoundedUser,
                  label: 'Last Name',
                  value: request.lastName,
                ),
                _DetailRow(
                  icon: HugeIcons.strokeRoundedIdentityCard,
                  label: 'Document No.',
                  value: hideMiddleCharacters(request.documentNumber),
                ),
                _DetailRow(
                  icon: HugeIcons.strokeRoundedMail01,
                  label: 'Email',
                  value: request.email,
                  isLast: true,
                ),
              ],
            ),
          ),

          Spaces.smallTopSpace,

          // Info banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: HexColor(AppColors.fadedOrange).withAlpha(120),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: HexColor(AppColors.fadedOrange2),
              ),
            ),
            child: Row(
              children: [
                Icon(HugeIcons.strokeRoundedInformationCircle,
                    size: 18,
                    color: HexColor(AppColors.primaryOrange)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Please ensure all details are correct before proceeding. These will be used to create your SasaPay wallet.',
                    style: Grays.smallestPoppinsHint,
                  ),
                ),
              ],
            ),
          ),
          Spaces.mediumTopSpace,
        ],
      ),
    );
  }
}

/// A sleek detail row with icon, label & value
class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isLast;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Container(
                height: 34,
                width: 34,
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withAlpha(18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon,
                    size: 16,
                    color: HexColor(AppColors.fadedGreen)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: Grays.smallestPoppinsHint),
                    const SizedBox(height: 2),
                    Text(value,
                        style: Blacks.smallestBolderPoppins,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              Icon(HugeIcons.strokeRoundedCheckmarkCircle02,
                  size: 16,
                  color: HexColor(AppColors.brightGreen).withAlpha(180)),
            ],
          ),
        ),
        if (!isLast)
          Divider(
            height: 1,
            color: Colors.black.withAlpha(15),
          ),
      ],
    );
  }
}
