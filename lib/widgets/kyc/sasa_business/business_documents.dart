import 'dart:io';
import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';

class BusinessDocuments extends StatelessWidget {
  const BusinessDocuments({super.key});

  @override
  Widget build(BuildContext context) {
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
                    HugeIcons.strokeRoundedFolderAttachment,
                    size: 32,
                    color: HexColor(AppColors.fadedGreen),
                  ),
                ),
              ),
              Spaces.tinyTopSpace,
              Center(
                child: Text('Business Documents',
                    style: Blacks.tinyBolderPoppins),
              ),
              const SizedBox(height: 4),
              Center(
                child: Padding(
                  padding: Paddings.mediumHorizontal,
                  child: Text(
                    'Upload additional documents required for your SasaPay business wallet.',
                    style: Grays.tinyPoppinsHint,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              Spaces.smallTopSpace,

              // ═══════════════════════════════════════════════
              // SECTION 1: Business Documents
              // ═══════════════════════════════════════════════
              _SectionHeader(
                icon: HugeIcons.strokeRoundedFile02,
                title: 'Business Documents',
              ),
              const SizedBox(height: 4),
              Text(
                'Upload your CR-12, proof of address, and proof of bank statement.',
                style: Grays.smallestPoppinsHint,
              ),
              const SizedBox(height: 12),

              // ── CR-12 Document ──
              _DocumentPickerCard(
                label: 'CR-12 Document',
                description: 'Company registration form listing directors & shareholders',
                icon: HugeIcons.strokeRoundedUserGroup,
                file: kyc.cr12Doc,
                onPick: () => kyc.pickCr12(),
                onRemove: kyc.removeCr12,
              ),
              Spaces.smallTopSpace,

              // ── Proof of Address ──
              _DocumentPickerCard(
                label: 'Proof of Address',
                description: 'Utility bill, bank statement, or lease agreement',
                icon: HugeIcons.strokeRoundedLocation01,
                file: kyc.proofOfAddressDoc,
                onPick: () => kyc.pickProofOfAddress(),
                onRemove: kyc.removeProofOfAddress,
              ),
              Spaces.smallTopSpace,

              // ── Proof of Bank ──
              _DocumentPickerCard(
                label: 'Proof of Bank',
                description: 'Bank statement or bank confirmation letter',
                icon: HugeIcons.strokeRoundedBank,
                file: kyc.proofOfBankDoc,
                onPick: () => kyc.pickProofOfBank(),
                onRemove: kyc.removeProofOfBank,
              ),

              Spaces.mediumTopSpace,

              // ═══════════════════════════════════════════════
              // SECTION 2: Director Documents
              // ═══════════════════════════════════════════════
              _SectionHeader(
                icon: HugeIcons.strokeRoundedUserAccount,
                title: 'Director Documents',
              ),
              const SizedBox(height: 4),
              Text(
                'Upload front ID, back ID, and KRA PIN certificate for each director.',
                style: Grays.smallestPoppinsHint,
              ),
              const SizedBox(height: 12),

              if (kyc.directors.isEmpty)
                _EmptyDirectorsNotice()
              else
                ...List.generate(kyc.directors.length, (index) {
                  return _DirectorDocsCard(
                    index: index,
                    director: kyc.directors[index],
                    onPickFrontId: () => kyc.pickDirectorFrontId(index),
                    onPickBackId: () => kyc.pickDirectorBackId(index),
                    onPickKraPin: () => kyc.pickDirectorKraPin(index),
                    onRemoveFrontId: () => kyc.removeDirectorFrontId(index),
                    onRemoveBackId: () => kyc.removeDirectorBackId(index),
                    onRemoveKraPin: () => kyc.removeDirectorKraPin(index),
                  );
                }),

              Spaces.smallTopSpace,

              // ── Completion status banner ──
              _CompletionBanner(
                allBusinessDocs: kyc.allBusinessDocsProvided,
                allDirectorDocs: kyc.allDirectorDocsComplete,
                hasDirectors: kyc.directors.isNotEmpty,
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
// Document picker card (tap to pick, shows file name when picked)
// ─────────────────────────────────────────────
class _DocumentPickerCard extends StatelessWidget {
  final String label;
  final String description;
  final IconData icon;
  final File? file;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _DocumentPickerCard({
    required this.label,
    required this.description,
    required this.icon,
    required this.file,
    required this.onPick,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final bool hasFile = file != null;
    final fileName = hasFile ? file!.path.split('/').last : '';

    return GestureDetector(
      onTap: hasFile ? null : onPick,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: hasFile ? HexColor(AppColors.primaryGreen).withAlpha(8) : HexColor('#F8FAF9'),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasFile
                ? HexColor(AppColors.primaryGreen).withAlpha(100)
                : HexColor('#E0E5E2'),
            width: hasFile ? 1.5 : 1,
          ),
          boxShadow: hasFile
              ? [
                  BoxShadow(
                    color: Colors.black.withAlpha(8),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Row(
          children: [
            // Icon
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: hasFile
                    ? HexColor(AppColors.primaryGreen).withAlpha(20)
                    : HexColor(AppColors.lightGray).withAlpha(60),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                hasFile ? HugeIcons.strokeRoundedCheckmarkCircle02 : icon,
                size: 20,
                color: hasFile
                    ? HexColor(AppColors.brightGreen)
                    : HexColor(AppColors.darkerGray2),
              ),
            ),
            const SizedBox(width: 12),
            // Text content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: Blacks.smallestBolderPoppins),
                  const SizedBox(height: 2),
                  Text(
                    hasFile ? fileName : description,
                    style: Grays.smallestPoppinsHint,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Action button
            if (hasFile)
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
              )
            else
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: HexColor(AppColors.primaryGreen).withAlpha(12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  HugeIcons.strokeRoundedUpload04,
                  size: 16,
                  color: HexColor(AppColors.primaryGreen),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Director documents card (front, back, KRA per director)
// ─────────────────────────────────────────────
class _DirectorDocsCard extends StatelessWidget {
  final int index;
  final Director director;
  final VoidCallback onPickFrontId;
  final VoidCallback onPickBackId;
  final VoidCallback onPickKraPin;
  final VoidCallback onRemoveFrontId;
  final VoidCallback onRemoveBackId;
  final VoidCallback onRemoveKraPin;

  const _DirectorDocsCard({
    required this.index,
    required this.director,
    required this.onPickFrontId,
    required this.onPickBackId,
    required this.onPickKraPin,
    required this.onRemoveFrontId,
    required this.onRemoveBackId,
    required this.onRemoveKraPin,
  });

  @override
  Widget build(BuildContext context) {
    final directorName = director.nameController.text.isNotEmpty
        ? director.nameController.text
        : 'Director ${index + 1}';
    final allComplete = director.frontIdFile != null &&
        director.backIdFile != null &&
        director.kraPinFile != null;

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
                  color: allComplete
                      ? HexColor(AppColors.brightGreen).withAlpha(20)
                      : HexColor(AppColors.primaryGreen).withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: allComplete
                      ? Icon(HugeIcons.strokeRoundedCheckmarkCircle02,
                          size: 16,
                          color: HexColor(AppColors.brightGreen))
                      : Text(
                          '${index + 1}',
                          style: Blacks.smallestBoldPoppins.copyWith(
                            color: HexColor(AppColors.primaryGreen),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(directorName,
                        style: Blacks.smallestBolderPoppins,
                        overflow: TextOverflow.ellipsis),
                    if (director.idNumberController.text.isNotEmpty)
                      Text('ID: ${director.idNumberController.text}',
                          style: Grays.smallestPoppinsHint),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Front ID
          _MiniDocRow(
            label: 'Front ID',
            icon: HugeIcons.strokeRoundedIdentityCard,
            file: director.frontIdFile,
            onPick: onPickFrontId,
            onRemove: onRemoveFrontId,
          ),
          const SizedBox(height: 8),

          // Back ID
          _MiniDocRow(
            label: 'Back ID',
            icon: HugeIcons.strokeRoundedIdentityCard,
            file: director.backIdFile,
            onPick: onPickBackId,
            onRemove: onRemoveBackId,
          ),
          const SizedBox(height: 8),

          // KRA PIN
          _MiniDocRow(
            label: 'KRA PIN Certificate',
            icon: HugeIcons.strokeRoundedLicense,
            file: director.kraPinFile,
            onPick: onPickKraPin,
            onRemove: onRemoveKraPin,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Mini document row (compact file picker inside director card)
// ─────────────────────────────────────────────
class _MiniDocRow extends StatelessWidget {
  final String label;
  final IconData icon;
  final File? file;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _MiniDocRow({
    required this.label,
    required this.icon,
    required this.file,
    required this.onPick,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final bool hasFile = file != null;
    final fileName = hasFile ? file!.path.split('/').last : '';

    return GestureDetector(
      onTap: hasFile ? null : onPick,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: hasFile
              ? HexColor(AppColors.primaryGreen).withAlpha(8)
              : HexColor('#F5F7F6'),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: hasFile
                ? HexColor(AppColors.brightGreen).withAlpha(80)
                : HexColor('#E0E5E2'),
          ),
        ),
        child: Row(
          children: [
            Icon(
              hasFile ? HugeIcons.strokeRoundedCheckmarkCircle02 : icon,
              size: 16,
              color: hasFile
                  ? HexColor(AppColors.brightGreen)
                  : HexColor(AppColors.darkerGray2),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(label, style: Blacks.smallestBoldPoppins),
                  if (hasFile)
                    Text(
                      fileName,
                      style: Grays.smallestPoppinsHint,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            if (hasFile)
              GestureDetector(
                onTap: onRemove,
                child: Icon(
                  HugeIcons.strokeRoundedCancel01,
                  size: 16,
                  color: HexColor(AppColors.red).withAlpha(180),
                ),
              )
            else
              Icon(
                HugeIcons.strokeRoundedUpload04,
                size: 16,
                color: HexColor(AppColors.primaryGreen),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Empty directors notice
// ─────────────────────────────────────────────
class _EmptyDirectorsNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
      decoration: BoxDecoration(
        color: HexColor(AppColors.fadedOrange).withAlpha(120),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: HexColor(AppColors.fadedOrange2),
        ),
      ),
      child: Column(
        children: [
          Icon(HugeIcons.strokeRoundedUserGroup,
              size: 28,
              color: HexColor(AppColors.primaryOrange).withAlpha(180)),
          const SizedBox(height: 8),
          Text(
            'No directors added yet',
            style: Blacks.smallestBolderPoppins,
          ),
          const SizedBox(height: 4),
          Text(
            'Go back to the registration step to add directors before uploading their documents.',
            style: Grays.smallestPoppinsHint,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// Completion status banner
// ─────────────────────────────────────────────
class _CompletionBanner extends StatelessWidget {
  final bool allBusinessDocs;
  final bool allDirectorDocs;
  final bool hasDirectors;

  const _CompletionBanner({
    required this.allBusinessDocs,
    required this.allDirectorDocs,
    required this.hasDirectors,
  });

  @override
  Widget build(BuildContext context) {
    final allComplete = allBusinessDocs && allDirectorDocs && hasDirectors;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: allComplete
            ? HexColor(AppColors.primaryGreen).withAlpha(12)
            : HexColor(AppColors.fadedOrange).withAlpha(120),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: allComplete
              ? HexColor(AppColors.primaryGreen).withAlpha(60)
              : HexColor(AppColors.fadedOrange2),
        ),
      ),
      child: Row(
        children: [
          Icon(
            allComplete
                ? HugeIcons.strokeRoundedCheckmarkCircle02
                : HugeIcons.strokeRoundedInformationCircle,
            size: 18,
            color: allComplete
                ? HexColor(AppColors.brightGreen)
                : HexColor(AppColors.primaryOrange),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  allComplete
                      ? 'All documents uploaded!'
                      : 'Documents required',
                  style: Blacks.smallestBolderPoppins,
                ),
                const SizedBox(height: 2),
                Text(
                  allComplete
                      ? 'You can now proceed to activate your SasaPay business wallet.'
                      : _buildMissingText(),
                  style: Grays.smallestPoppinsHint,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _buildMissingText() {
    final missing = <String>[];
    if (!allBusinessDocs) missing.add('business documents');
    if (!hasDirectors) {
      missing.add('directors');
    } else if (!allDirectorDocs) {
      missing.add('director documents');
    }
    return 'Please upload all ${missing.join(' and ')} to proceed.';
  }
}
