import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

class Pledger extends StatelessWidget {
  final int index;
  final PledgeResponse pledge;
  const Pledger({super.key,
    required this.index,
    required this.pledge});

  @override
  Widget build(BuildContext context) {
    final nameController = TextEditingController(text: pledge.pledgerName);
    final phoneController = TextEditingController(text: pledge.pledgerPhone);
    final emailController = TextEditingController(text: pledge.pledgerEmail);
    final amountController = TextEditingController(text: pledge.amount.toString());

    // Avatar gradient based on index
    final avatarColors = [
      [HexColor('#FFF3E0'), HexColor('#FFE0B2')],
      [HexColor('#E8F5E9'), HexColor('#C8E6C9')],
      [HexColor('#E3F2FD'), HexColor('#BBDEFB')],
      [HexColor('#F3E5F5'), HexColor('#E1BEE7')],
    ];
    final avatarColorPair = avatarColors[index % avatarColors.length];

    // Calculate progress percentage
    final progress = pledge.amountPaid != null && pledge.amount != null && pledge.amount! > 0
        ? (pledge.amountPaid! / pledge.amount!).clamp(0.0, 1.0)
        : 0.0;
    final progressPercent = (progress * 100).toInt();

    // Alternate gradient colors
    final isEven = index % 2 == 0;
    final gradientColors = isEven
        ? [Colors.white, HexColor('#FFFBF8')]
        : [Colors.white, HexColor('#F9FBF9')];

    return Consumer<FundraiserProvider>(
        builder: (_, fundraiserProvider, __) {
          return GestureDetector(
            onTap: () {
              showModalBottomSheet(
                  isScrollControlled: true,
                  scrollControlDisabledMaxHeightRatio: 1/1,
                  context: context,
                  builder: (context){
                    return Padding(
                      padding: EdgeInsets.only(
                          bottom: MediaQuery.of(context).viewInsets.bottom
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
                            tapped: ()async{
                              if(double.parse(amountController.text) < pledge.amount!){
                                Fluttertoast.cancel();
                                Fluttertoast.showToast(msg: "Your pledge cannot be less than the original amount");
                              }else{
                                showAdaptiveDialog(context: context,
                                    builder: (context)=>AiAnalysisAlert(
                                      icon: HugeIcons.strokeRoundedHealtcare,
                                      action: 'Updating Pledge',
                                    ));
                                await Provider.of<FundraiserProvider>(context,listen: false)
                                    .updatePledge(pledge.id!, double.parse(amountController.text));
                                Navigator.pop(context);
                                Navigator.pop(context);
                                if(fundraiserProvider.pledgeResponse?.error == null){
                                  showGeneralDialog(
                                      context: context,
                                      pageBuilder: (context,anim1,anim2){
                                        return const SizedBox();
                                      },
                                      transitionDuration: const Duration(milliseconds: 400),
                                      transitionBuilder: (context,anim1,anim2,child){
                                        return SlideTransition(
                                          position: Tween(
                                              begin: const Offset(1, 0),
                                              end: const Offset(0, 0)
                                          ).animate(anim1),
                                          child: SuccessAlert(
                                              title: 'Operation Successful',
                                              content: 'Pledge Updated Successfully! Select another pledge to edit.',
                                              tapped: (){
                                                Navigator.pop(context);
                                              },
                                              anim1: anim1),);
                                      }
                                  );
                                }
                              }
                            },
                          ),
                          height: 500),
                    );
                  });
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: gradientColors,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: HexColor('#E8ECE9')),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(8),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Rank badge
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: HexColor(AppColors.primaryOrange).withAlpha(20),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: HexColor(AppColors.primaryOrange),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Avatar
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: avatarColorPair,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: avatarColorPair[1].withAlpha(80),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            (pledge.pledgerName ?? 'P').substring(0, 1).toUpperCase(),
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: HexColor(AppColors.primaryOrange),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              pledge.pledgerName ?? 'Anonymous',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(
                                  HugeIcons.strokeRoundedSmartPhone01,
                                  size: 11,
                                  color: HexColor(AppColors.darkerGray2),
                                ),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    pledge.pledgerPhone ?? '',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: HexColor(AppColors.darkerGray2),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Amount column
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  HexColor(AppColors.primaryOrange).withAlpha(20),
                                  HexColor(AppColors.primaryOrange).withAlpha(10),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: HexColor(AppColors.primaryOrange).withAlpha(40),
                              ),
                            ),
                            child: Text(
                              'KES ${formatThousands(amount: pledge.amount!, noDecimal: true)}',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: HexColor(AppColors.primaryOrange),
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: HexColor(AppColors.brightGreen).withAlpha(15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Paid: ${formatThousands(amount: pledge.amountPaid!, noDecimal: true)}',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600,
                                    color: HexColor(AppColors.brightGreen),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Progress section
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: progressPercent >= 100
                              ? HexColor(AppColors.brightGreen).withAlpha(15)
                              : HexColor(AppColors.primaryOrange).withAlpha(15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$progressPercent%',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: progressPercent >= 100
                                ? HexColor(AppColors.brightGreen)
                                : HexColor(AppColors.primaryOrange),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 8,
                            backgroundColor: HexColor(AppColors.lightestGray),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              progressPercent >= 100
                                  ? HexColor(AppColors.brightGreen)
                                  : HexColor(AppColors.primaryOrange),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        HugeIcons.strokeRoundedArrowRight01,
                        size: 16,
                        color: HexColor(AppColors.darkerGray2),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }
    );
  }
}
