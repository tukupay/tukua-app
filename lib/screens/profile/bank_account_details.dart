import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

class BankAccountDetails extends StatelessWidget {
  const BankAccountDetails({super.key});

  // Build info card section
  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    Widget? trailing,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(12),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: HexColor(AppColors.primaryGreen).withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: HexColor(AppColors.primaryGreen),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(title, style: Blacks.regularBoldCodeNext),
                ),
                if (trailing != null) trailing,
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  // Build detail row
  Widget _buildDetailRow(
    String label,
    String value,
    IconData icon, {
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 16,
            color: Colors.grey.shade600,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Grays.smallRoboto,
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: (valueColor != null
                      ? Blacks.regularBoldCodeNext.copyWith(color: valueColor)
                      : Blacks.regularBoldCodeNext),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<BankingProvider>(context, listen: false).resetBank();
      },
      child: Scaffold(
        backgroundColor: HexColor('#F8FAF9'),
        body: Consumer<BankingProvider>(
          builder: (_, banking, __) {
            if (banking.selectedBank == null) {
              return const SizedBox();
            }

            return Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: CustomScrollView(
                slivers: [
                  // Modern AppBar
                  SliverAppBar(
                    expandedHeight: 200,
                    floating: false,
                    pinned: true,
                    backgroundColor: HexColor(AppColors.primaryGreen),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    iconTheme: const IconThemeData(color: Colors.white),
                    flexibleSpace: FlexibleSpaceBar(
                      titlePadding: const EdgeInsets.only(left: 60, bottom: 16),
                      title: Text(
                        'Bank Account',
                        style: Whites.mediumBoldRoboto,
                      ),
                      background: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              HexColor(AppColors.primaryGreen),
                              HexColor(AppColors.primaryGreen).withAlpha(204),
                            ],
                          ),
                        ),
                        child: Stack(
                          children: [
                            Positioned(
                              right: -50,
                              top: -50,
                              child: Container(
                                width: 200,
                                height: 200,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withAlpha(25),
                                ),
                              ),
                            ),
                            Positioned(
                              left: -30,
                              bottom: -30,
                              child: Container(
                                width: 150,
                                height: 150,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withAlpha(25),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    actions: [
                      IconButton(
                        onPressed: () {
                          Navigator.pushNamed(context, Routes.editBankAccount);
                        },
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(51),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            HugeIcons.strokeRoundedPencilEdit01,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                  ),

                  // Content
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),

                          // Account Information Card
                          _buildInfoCard(
                            title: "Account Information",
                            icon: HugeIcons.strokeRoundedBank,
                            children: [
                              _buildDetailRow(
                                "Bank Name",
                                banking.selectedBank?.bankName ?? 'Bank Name',
                                HugeIcons.strokeRoundedBank,
                              ),
                              _buildDetailRow(
                                "Account Name",
                                banking.selectedBank?.accountName ?? 'Account Name',
                                HugeIcons.strokeRoundedUser,
                              ),
                              _buildDetailRow(
                                "Account Number",
                                banking.selectedBank?.accountNumber ?? 'Account Number',
                                HugeIcons.strokeRoundedCreditCardValidation,
                              ),
                              if (banking.selectedBank?.branch != null)
                                _buildDetailRow(
                                  "Branch",
                                  banking.selectedBank!.branch!,
                                  HugeIcons.strokeRoundedLocation01,
                                ),
                              const SizedBox(height: 4),
                              Align(
                                alignment: Alignment.centerRight,
                                child: Text(
                                  "Added ${formatDate(banking.selectedBank?.createdAt ?? DateTime.now())} at ${formatTime(banking.selectedBank?.createdAt ?? DateTime.now())}",
                                  style: Grays.smallestPoppinsHint,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
