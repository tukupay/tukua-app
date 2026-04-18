import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class BusinessRegistration extends StatefulWidget {
  const BusinessRegistration({super.key});

  @override
  State<BusinessRegistration> createState() => _BusinessRegistrationState();
}

class _BusinessRegistrationState extends State<BusinessRegistration> {

  final businessLocationController = TextEditingController();
  final accountNumberController = TextEditingController();
  final estMonthlyAmtController = TextEditingController();
  final estMonthlyCountController = TextEditingController();

  late SasaBusinessKycProvider _kyc;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _kyc = Provider.of<SasaBusinessKycProvider>(context, listen: false);
  }


  @override
  void dispose(){
    businessLocationController.dispose();
    accountNumberController.dispose();
    estMonthlyAmtController.dispose();
    estMonthlyCountController.dispose();
    for(final d in _kyc.directors) {
      d.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    return Consumer<SasaBusinessKycProvider>(
      builder: (_, kyc, __) {
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header ──
              Center(
                child: Container(
                  height: 70,
                  width: 70,
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
                    HugeIcons.strokeRoundedBuilding06,
                    size: 32,
                    color: HexColor(AppColors.fadedGreen),
                  ),
                ),
              ),
              Spaces.tinyTopSpace,
              Center(
                child: Text('Business Registration',
                    style: Blacks.tinyBolderPoppins),
              ),
              const SizedBox(height: 4),
              Center(
                child: Padding(
                  padding: Paddings.mediumHorizontal,
                  child: Text(
                    'Confirm your business details and provide additional information.',
                    style: Grays.tinyPoppinsHint,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              Spaces.smallTopSpace,

              // ═══════════════════════════════════════════════
              // SECTION 1: Existing KYC Details (read-only)
              // ═══════════════════════════════════════════════
              _SectionHeader(
                icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                title: 'Existing Business Details',
              ),
              const SizedBox(height: 8),
              Container(
                width: size.width,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                decoration: GlassMorphism.greenTinted(borderRadius: 16),
                child: Column(
                  children: [
                    _ReadOnlyRow(label: 'Business Name', value: kyc.businessName),
                    _ReadOnlyRow(label: 'Reg No. (Cert)', value: kyc.registrationNumber),
                    _ReadOnlyRow(label: 'KRA PIN', value: hideMiddleCharacters(kyc.kraPin)),
                    _ReadOnlyRow(label: 'Email', value: kyc.email),
                    _ReadOnlyRow(label: 'Mobile Number', value: hideMiddleCharacters(kyc.mobileNumber), isLast: true),
                  ],
                ),
              ),

              Spaces.mediumTopSpace,

              // ═══════════════════════════════════════════════
              // SECTION 2: New Business Fields
              // ═══════════════════════════════════════════════
              _SectionHeader(
                icon: HugeIcons.strokeRoundedEdit02,
                title: 'Additional Business Information',
              ),
              const SizedBox(height: 12),

              // ── Business Type (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.businessType.isEmpty ? null : kyc.businessType,
                items: SasaBusinessKycProvider.businessTypes,
                onSelected: kyc.selectBusinessType,
                itemLabelBuilder: (s) => s,
                label: 'Business Type',
                icon: HugeIcons.strokeRoundedBuilding04,
                sheetTitle: 'Select Business Type',
                sheetSubtitle: 'Choose your business structure',
              ),
              Spaces.smallTopSpace,

              // ── Business Category (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.businessCategory.isEmpty ? null : kyc.businessCategory,
                items: SasaBusinessKycProvider.businessCategories,
                onSelected: kyc.selectBusinessCategory,
                itemLabelBuilder: (s) => s,
                label: 'Business Category',
                icon: HugeIcons.strokeRoundedFolder01,
                sheetTitle: 'Select Business Category',
                showSearch: true,
              ),
              Spaces.smallTopSpace,

              // ── Business Subcategory (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.businessSubcategory.isEmpty ? null : kyc.businessSubcategory,
                items: SasaBusinessKycProvider.businessSubcategories,
                onSelected: kyc.selectBusinessSubcategory,
                itemLabelBuilder: (s) => s,
                label: 'Business Subcategory',
                icon: HugeIcons.strokeRoundedFolder01,
                sheetTitle: 'Select Business Subcategory',
                showSearch: true,
              ),
              Spaces.smallTopSpace,

              // ── Business Location (TI) ──
              LabeledField(
                label: 'Business Location',
                hint: 'e.g. Westlands, Nairobi',
                enabled: true,
                controller: businessLocationController,
                canGoNext: true,
              ),
              Spaces.smallTopSpace,

              // ── Product Type (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.productType.isEmpty ? null : kyc.productType,
                items: SasaBusinessKycProvider.productTypes,
                onSelected: kyc.selectProductType,
                itemLabelBuilder: (s) => s,
                label: 'Product Type',
                icon: HugeIcons.strokeRoundedShoppingBag01,
                sheetTitle: 'Select Product Type',
              ),
              Spaces.smallTopSpace,

              // ── Country (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.countryId.isEmpty ? null : kyc.countryId,
                items: SasaBusinessKycProvider.countries,
                onSelected: kyc.selectCountry,
                itemLabelBuilder: (s) => s,
                label: 'Country',
                icon: HugeIcons.strokeRoundedGlobe02,
                sheetTitle: 'Select Country',
              ),
              Spaces.smallTopSpace,

              // ── Subregion (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.subregionId.isEmpty ? null : kyc.subregionId,
                items: SasaBusinessKycProvider.subregions,
                onSelected: kyc.selectSubregion,
                itemLabelBuilder: (s) => s,
                label: 'Subregion',
                icon: HugeIcons.strokeRoundedLocation01,
                sheetTitle: 'Select Subregion',
                showSearch: true,
              ),
              Spaces.smallTopSpace,

              // ── Industry (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.industryId.isEmpty ? null : kyc.industryId,
                items: SasaBusinessKycProvider.industries,
                onSelected: kyc.selectIndustry,
                itemLabelBuilder: (s) => s,
                label: 'Industry',
                icon: HugeIcons.strokeRoundedFactory,
                sheetTitle: 'Select Industry',
                showSearch: true,
              ),
              Spaces.smallTopSpace,

              // ── Sub Industry (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.subIndustryId.isEmpty ? null : kyc.subIndustryId,
                items: SasaBusinessKycProvider.subIndustries,
                onSelected: kyc.selectSubIndustry,
                itemLabelBuilder: (s) => s,
                label: 'Sub Industry',
                icon: HugeIcons.strokeRoundedFactory,
                sheetTitle: 'Select Sub Industry',
                showSearch: true,
              ),

              Spaces.mediumTopSpace,

              // ═══════════════════════════════════════════════
              // SECTION 3: Banking Details
              // ═══════════════════════════════════════════════
              _SectionHeader(
                icon: HugeIcons.strokeRoundedBank,
                title: 'Banking & Transaction Details',
              ),
              const SizedBox(height: 12),

              // ── Bank Code (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.bankCode.isEmpty ? null : kyc.bankCode,
                items: SasaBusinessKycProvider.bankCodes,
                onSelected: kyc.selectBankCode,
                itemLabelBuilder: (s) => s,
                label: 'Bank',
                icon: HugeIcons.strokeRoundedBank,
                sheetTitle: 'Select Bank',
                showSearch: true,
              ),
              Spaces.smallTopSpace,

              // ── Account Number (TI) ──
              LabeledField(
                label: 'Account Number',
                hint: 'e.g. 1234567890',
                enabled: true,
                controller: accountNumberController,
                isNumber: true,
                canGoNext: true,
              ),
              Spaces.smallTopSpace,

              // ── Purpose (DD) ──
              SimpleSelectorCard<String>(
                selectedItem: kyc.purpose.isEmpty ? null : kyc.purpose,
                items: SasaBusinessKycProvider.purposes,
                onSelected: kyc.selectPurpose,
                itemLabelBuilder: (s) => s,
                label: 'Purpose',
                icon: HugeIcons.strokeRoundedTarget01,
                sheetTitle: 'Select Purpose',
                sheetSubtitle: 'What will you primarily use SasaPay for?',
              ),
              Spaces.smallTopSpace,

              // ── Est. Monthly Transaction Amount (NI) ──
              LabeledField(
                label: 'Est. Monthly Transaction Amount (KES)',
                hint: 'e.g. 1000000',
                enabled: true,
                controller: estMonthlyAmtController,
                isNumber: true,
                canGoNext: true,
              ),
              Spaces.smallTopSpace,

              // ── Est. Monthly Transaction Count (NI) ──
              LabeledField(
                label: 'Est. Monthly Transaction Count',
                hint: 'e.g. 100',
                enabled: true,
                controller: estMonthlyCountController,
                isNumber: true,
              ),

              Spaces.mediumTopSpace,

              // ═══════════════════════════════════════════════
              // SECTION 4: Directors (Dynamic List)
              // ═══════════════════════════════════════════════
              _SectionHeader(
                icon: HugeIcons.strokeRoundedUserGroup,
                title: 'Directors',
              ),
              const SizedBox(height: 4),
              Text(
                'Add all company directors. Each director requires a name, ID number, and phone number.',
                style: Grays.smallestPoppinsHint,
              ),
              const SizedBox(height: 12),

              // Director cards
              ...List.generate(kyc.directors.length, (index) {
                return _DirectorCard(
                  index: index,
                  director: kyc.directors[index],
                  onRemove: () => kyc.removeDirector(index),
                  isLast: index == kyc.directors.length - 1,
                );
              }),

              // Add director button
              GestureDetector(
                onTap: kyc.addDirector,
                child: Container(
                  width: size.width,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withAlpha(12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: HexColor(AppColors.primaryGreen).withAlpha(60),
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        HugeIcons.strokeRoundedAdd01,
                        size: 18,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Add Director',
                        style: Blacks.smallestBoldPoppins.copyWith(
                          color: HexColor(AppColors.primaryGreen),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              Spaces.smallTopSpace,

              // ── Info banner ──
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
                        'Please ensure all details are correct before proceeding. These will be used to create your SasaPay business wallet.',
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
      },
    );
  }
}

// ─────────────────────────────────────────────
// Section header with icon + title
// ─────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: HexColor(AppColors.primaryGreen).withAlpha(18),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 16, color: HexColor(AppColors.fadedGreen)),
        ),
        const SizedBox(width: 10),
        Text(title, style: Blacks.smallestBolderPoppins),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Read-only detail row (for existing KYC data)
// ─────────────────────────────────────────────
class _ReadOnlyRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isLast;

  const _ReadOnlyRow({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
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
          Divider(height: 1, color: Colors.black.withAlpha(15)),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// Director card (dynamic list item)
// ─────────────────────────────────────────────
class _DirectorCard extends StatelessWidget {
  final int index;
  final Director director;
  final VoidCallback onRemove;
  final bool isLast;

  const _DirectorCard({
    required this.index,
    required this.director,
    required this.onRemove,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: GlassMorphism.standard(borderRadius: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Container(
                height: 30,
                width: 30,
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: Blacks.smallestBoldPoppins.copyWith(
                      color: HexColor(AppColors.primaryGreen),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text('Director ${index + 1}',
                    style: Blacks.smallestBolderPoppins),
              ),
              GestureDetector(
                onTap: onRemove,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.red).withAlpha(15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    HugeIcons.strokeRoundedDelete02,
                    size: 16,
                    color: HexColor(AppColors.red),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Director Name
          LabeledField(
            label: 'Full Name',
            hint: 'e.g. John Kamau Mwangi',
            enabled: true,
            controller: director.nameController,
            canGoNext: true,
          ),
          Spaces.tinyTopSpace,

          // Director ID Number
          LabeledField(
            label: 'ID Number',
            hint: 'e.g. 32456789',
            enabled: true,
            controller: director.idNumberController,
            isNumber: true,
            canGoNext: true,
          ),
          Spaces.tinyTopSpace,

          // Director Phone
          LabeledField(
            label: 'Phone Number',
            hint: 'e.g. 0712345678',
            enabled: true,
            controller: director.phoneController,
            isNumber: true,
          ),
        ],
      ),
    );
  }
}
