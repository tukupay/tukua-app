import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import '../widget.dart';
import '../../constants/constants.dart';

/// Modern fintech-styled pledge card
/// Displays pledge details with status indicators and edit capability
class PublicPledgeCard extends StatelessWidget {
  final int index;
  final PledgeResponse pledge;
  const PublicPledgeCard({
    super.key,
    required this.index,
    required this.pledge,
  });

  @override
  Widget build(BuildContext context) {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final emailController = TextEditingController();
    final amountController = TextEditingController(text: pledge.amount.toString());

    return Consumer2<FundraiserProvider, ProfileProvider>(
      builder: (_, fundraiserProvider, profile, __) {
        final isOwner = fundraiserProvider.selectedFundraiser?.ownerId == profile.user?.userId;
        final status = pledge.status ?? 'pending';

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: _getGradientColors(status),
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _getBorderColor(status),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(8),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Index badge
              _buildIndexBadge(),
              const SizedBox(width: 12),

              // Pledge icon with progress indicator
              _buildPledgeIcon(status),
              const SizedBox(width: 12),

              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            pledge.message ?? 'Pledge Commitment',
                            style: Blacks.tinyBoldGrotesk.copyWith(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isOwner) _buildOwnerBadge(),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _buildStatusChip(status),
                        const SizedBox(width: 8),
                        Icon(
                          HugeIcons.strokeRoundedCalendar03,
                          size: 11,
                          color: HexColor(AppColors.darkerGray2),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          pledge.pledgeDate != null
                              ? DateFormat.MMMd().format(pledge.pledgeDate!)
                              : '-',
                          style: Grays.tinySemiGrotesk.copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Progress bar
                    _buildProgressBar(),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // Amount & Edit
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'KES ${formatThousands(amount: pledge.amount ?? 0, noDecimal: true)}',
                    style: Greens.regularBoldCodeNext.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Remaining: ${formatThousands(amount: pledge.amountRemaining ?? 0, noDecimal: true)}',
                    style: Grays.tinySemiGrotesk.copyWith(fontSize: 9),
                  ),
                  const SizedBox(height: 6),
                  // Edit button
                  _buildEditButton(
                    context,
                    fundraiserProvider,
                    profile,
                    nameController,
                    phoneController,
                    emailController,
                    amountController,
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildIndexBadge() {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: HexColor(AppColors.primaryGreen).withAlpha(25),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Text(
          '${index + 1}',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: HexColor(AppColors.primaryGreen),
          ),
        ),
      ),
    );
  }

  Widget _buildPledgeIcon(String status) {
    Color iconBgStart;
    Color iconBgEnd;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        iconBgStart = HexColor('#E8F5E9');
        iconBgEnd = HexColor('#C8E6C9');
        icon = HugeIcons.strokeRoundedCheckmarkCircle01;
        break;
      case 'partial':
        iconBgStart = HexColor('#FFF3E0');
        iconBgEnd = HexColor('#FFE0B2');
        icon = HugeIcons.strokeRoundedTimeHalfPass;
        break;
      case 'cancelled':
        iconBgStart = HexColor('#FFEBEE');
        iconBgEnd = HexColor('#FFCDD2');
        icon = HugeIcons.strokeRoundedCancelCircle;
        break;
      default: // pending
        iconBgStart = HexColor('#E3F2FD');
        iconBgEnd = HexColor('#BBDEFB');
        icon = HugeIcons.strokeRoundedHandPrayer;
    }

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [iconBgStart, iconBgEnd],
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        icon,
        color: HexColor(AppColors.primaryGreen),
        size: 18,
      ),
    );
  }

  Widget _buildOwnerBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: HexColor(AppColors.fadedOrange),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        'By You',
        style: TextStyle(
          fontSize: 8,
          fontWeight: FontWeight.w600,
          color: HexColor(AppColors.primaryOrange),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        bgColor = HexColor('#E8F5E9');
        textColor = HexColor('#2E7D32');
        break;
      case 'partial':
        bgColor = HexColor('#FFF8E1');
        textColor = HexColor('#F9A825');
        break;
      case 'cancelled':
        bgColor = HexColor('#FFEBEE');
        textColor = HexColor('#C62828');
        break;
      default: // pending
        bgColor = HexColor('#E3F2FD');
        textColor = HexColor('#1976D2');
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.substring(0, 1).toUpperCase() + status.substring(1),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    final total = pledge.amount ?? 1;
    final paid = pledge.amountPaid ?? 0;
    final progress = total > 0 ? (paid / total).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 4,
          decoration: BoxDecoration(
            color: HexColor('#E8ECE9'),
            borderRadius: BorderRadius.circular(2),
          ),
          child: FractionallySizedBox(
            widthFactor: 1,
            child: Align(
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: progress,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        HexColor(AppColors.primaryGreen),
                        HexColor(AppColors.fadedGreen),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '${(progress * 100).toStringAsFixed(0)}% paid',
          style: Grays.tinySemiGrotesk.copyWith(fontSize: 8),
        ),
      ],
    );
  }

  Widget _buildEditButton(
    BuildContext context,
    FundraiserProvider fundraiserProvider,
    ProfileProvider profile,
    TextEditingController nameController,
    TextEditingController phoneController,
    TextEditingController emailController,
    TextEditingController amountController,
  ) {
    return GestureDetector(
      onTap: () => _showEditSheet(
        context,
        fundraiserProvider,
        profile,
        nameController,
        phoneController,
        emailController,
        amountController,
      ),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: HexColor(AppColors.primaryGreen).withAlpha(20),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(
          HugeIcons.strokeRoundedEdit02,
          color: HexColor(AppColors.primaryGreen),
          size: 16,
        ),
      ),
    );
  }

  void _showEditSheet(
    BuildContext context,
    FundraiserProvider fundraiserProvider,
    ProfileProvider profile,
    TextEditingController nameController,
    TextEditingController phoneController,
    TextEditingController emailController,
    TextEditingController amountController,
  ) {
    String firstName = profile.user?.firstName ?? 'Your';
    String lastName = profile.user?.lastName ?? 'Name';
    nameController.text = '$firstName $lastName';
    phoneController.text = profile.user?.phoneNumber ?? 'Your Phone';
    emailController.text = profile.user?.email ?? 'Your Email';

    showModalBottomSheet(
      isScrollControlled: true,
      scrollControlDisabledMaxHeightRatio: 1,
      context: context,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: PlainSheet(
            title: "Edit Pledge",
            subTitle: "Update the pledged amount",
            body: NewPledgerForm(
              nameController: nameController,
              nameEnabled: false,
              phoneController: phoneController,
              phoneEnabled: false,
              emailController: emailController,
              emailEnabled: false,
              amountController: amountController,
              textButton: "Update",
              tapped: () async {
                if (double.parse(amountController.text) < pledge.amount!) {
                  Fluttertoast.cancel();
                  Fluttertoast.showToast(
                    msg: "Your pledge cannot be less than the original amount",
                  );
                } else {
                  showAdaptiveDialog(
                    context: context,
                    builder: (context) => AiAnalysisAlert(
                      icon: HugeIcons.strokeRoundedHealtcare,
                      action: 'Updating Pledge',
                    ),
                  );
                  await Provider.of<FundraiserProvider>(context, listen: false)
                      .updateMyPledge(
                    pledge.id!,
                    double.parse(amountController.text),
                  );
                  Navigator.pop(context);
                  if (fundraiserProvider.pledgeResponse?.error == null) {
                    showGeneralDialog(
                      context: context,
                      pageBuilder: (context, anim1, anim2) {
                        return const SizedBox();
                      },
                      transitionDuration: const Duration(milliseconds: 400),
                      transitionBuilder: (context, anim1, anim2, child) {
                        return SlideTransition(
                          position: Tween(
                            begin: const Offset(1, 0),
                            end: const Offset(0, 0),
                          ).animate(anim1),
                          child: SuccessAlert(
                            title: 'Operation Successful',
                            content:
                                'Pledge Updated Successfully! Select another pledge to edit.',
                            tapped: () {
                              Navigator.pop(context);
                            },
                            anim1: anim1,
                          ),
                        );
                      },
                    );
                  }
                }
              },
            ),
            height: 500,
          ),
        );
      },
    );
  }

  List<Color> _getGradientColors(String status) {
    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        return [Colors.white, HexColor('#F1F8E9')];
      case 'partial':
        return [Colors.white, HexColor('#FFF8E1')];
      case 'cancelled':
        return [Colors.white, HexColor('#FFF5F5')];
      default:
        return [Colors.white, HexColor('#F8FAF9')];
    }
  }

  Color _getBorderColor(String status) {
    switch (status.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
        return HexColor('#C8E6C9');
      case 'partial':
        return HexColor('#FFE0B2');
      case 'cancelled':
        return HexColor('#FFCDD2');
      default:
        return HexColor('#E8ECE9');
    }
  }
}
