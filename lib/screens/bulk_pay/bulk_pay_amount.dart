import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../routes.dart';

class BulkPayAmount extends StatefulWidget {
  const BulkPayAmount({super.key});

  @override
  State<BulkPayAmount> createState() => _BulkPayAmountState();
}

class _BulkPayAmountState extends State<BulkPayAmount> {
  final titleController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return PopScope(
      onPopInvokedWithResult: (bool b, res) {
        Provider.of<BulkPayProvider>(context, listen: false).resetContactAmounts();
      },
      child: Scaffold(
        backgroundColor: HexColor('#F8FAF9'),
        body: Consumer2<BulkPayProvider, WalletProvider>(
          builder: (_, bulkPay, wallets, __) {
            return Container(
              height: size.height,
              width: size.width,
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: AssetImage(Strings.imageAsset('bg.png')),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage(Strings.imageAsset('gradient2.png')),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Column(
                  children: [
                    // Fixed App Bar
                    SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: HexColor('#F0F4F3'),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(HugeIcons.strokeRoundedArrowLeft01,
                                    color: HexColor(AppColors.darkerGray2), size: 20),
                              ),
                            ),
                            const Spacer(),
                            Column(
                              children: [
                                Text('Set Amounts', style: Blacks.mediumSemiRubik),
                                Text('Allocate amounts to recipients',
                                    style: Grays.smallestPoppinsHint.copyWith(fontSize: 10)),
                              ],
                            ),
                            const Spacer(),
                            const SizedBox(width: 36), // Balance for back button
                          ],
                        ),
                      ),
                    ),

                    // Summary Card
                    Builder(
                      builder: (context) {
                        final isInsufficient = (bulkPay.selectedWallet?.balance ?? 0) < bulkPay.totalAmount && bulkPay.totalAmount > 0;
                        return Container(
                      margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: isInsufficient
                              ? [const Color(0xFFE53935), const Color(0xFFEF5350)]
                              : [
                            HexColor(AppColors.primaryGreen),
                            HexColor(AppColors.fadedGreen),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: (isInsufficient ? const Color(0xFFE53935) : HexColor(AppColors.primaryGreen)).withAlpha(76),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Total Amount',
                                    style: Whites.tinyPoppins.copyWith(
                                      color: Colors.white.withAlpha(204),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'KSH ${formatThousands(amount: bulkPay.totalAmount.toDouble(), noDecimal: true)}',
                                    style: Whites.largeSemiPoppins.copyWith(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withAlpha(51),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(HugeIcons.strokeRoundedUser,
                                        color: Colors.white, size: 14),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${bulkPay.selectedContacts.length}',
                                      style: Whites.tinyPoppins,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(26),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(isInsufficient ? HugeIcons.strokeRoundedAlertCircle : HugeIcons.strokeRoundedWallet02,
                                        color: Colors.white, size: 16),
                                    const SizedBox(width: 8),
                                    Text(
                                      bulkPay.selectedWallet?.name ??
                                          bulkPay.selectedWallet?.purposeTag ??
                                          'Wallet',
                                      style: Whites.smallBoldRoboto,
                                    ),
                                  ],
                                ),
                                Text(
                                  'KSH ${formatThousands(amount: bulkPay.selectedWallet?.balance ?? 0, noDecimal: true)}',
                                  style: Whites.tinyPoppins,
                                ),
                              ],
                            ),
                          ),
                          if (isInsufficient) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(38),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.info_outline_rounded, size: 13, color: Colors.white),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Insufficient balance',
                                    style: Whites.tinyPoppins.copyWith(fontSize: 11, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                      },
                    ),

                    // Scrollable Content
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Payment Title Card
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(100),
                                border: Border.all(color: HexColor(AppColors.lightGray)),
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(10),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
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
                                        child: Icon(HugeIcons.strokeRoundedEdit02,
                                            size: 18, color: HexColor(AppColors.primaryGreen)),
                                      ),
                                      const SizedBox(width: 12),
                                      Text('Payment Title (Optional)', style: Blacks.tinyBolderPoppins),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: HexColor('#F8FAF9'),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: HexColor('#E8ECE9')),
                                    ),
                                    child: TextField(
                                      controller: titleController,
                                      decoration: InputDecoration(
                                        hintText: 'e.g., Monthly Salary',
                                        hintStyle: Grays.tinyPoppinsHint,
                                        border: InputBorder.none,
                                        contentPadding: const EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 12),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Bank Charges Info
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: HexColor('#E8F5E9'),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: HexColor(AppColors.primaryGreen).withAlpha(51)),
                              ),
                              child: Row(
                                children: [
                                  Icon(HugeIcons.strokeRoundedInformationCircle,
                                      color: HexColor(AppColors.primaryGreen), size: 18),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'Bank Charges: KSH 0.00',
                                      style: TextStyle(
                                        color: HexColor(AppColors.primaryGreen),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Same Amount Toggle
                            BulkSameAmount(),
                            const SizedBox(height: 16),

                            // Recipients List Header
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
                                Text('Recipients', style: Blacks.tinyBolderPoppins),
                              ],
                            ),
                            // Recipients List
                            ListView.separated(
                              shrinkWrap: true,
                              padding: Paddings.smallVertical,
                              physics: const NeverScrollableScrollPhysics(),
                              separatorBuilder: (context, index) => const SizedBox(height: 12),
                              itemCount: bulkPay.selectedContacts.length,
                              itemBuilder: (context, index) {
                                BulkPayContact contact = bulkPay.selectedContacts[index];
                                return RecipientAmountCard(
                                  showIndex: true,
                                  amount: contact.amountToSend,
                                  contact: contact,
                                  index: index,
                                );
                              },
                            ),
                            const SizedBox(height: 80),
                          ],
                        ),
                      ),
                    ),

                    // Bottom Action Button
                    Container(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(15),
                            blurRadius: 10,
                            offset: const Offset(0, -2),
                          ),
                        ],
                      ),
                      child: SafeArea(
                        top: false,
                        child: bulkPay.isSending
                            ? const Center(child: WaveDots())
                            : SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () async {
                                    final double walletBalance = bulkPay.selectedWallet?.balance ?? 0;
                                    final bool hasRecipientWithoutAmount = bulkPay.selectedContacts
                                        .any((contact) => contact.amountToSend <= 0);
                                    Fluttertoast.cancel();

                                    if (bulkPay.selectedWallet == null) {
                                      Fluttertoast.showToast(msg: "Please select a source wallet.");
                                      return;
                                    } else if (walletBalance < bulkPay.totalAmount) {
                                      Fluttertoast.showToast(msg: "Insufficient balance in selected wallet");
                                      return;
                                    } else if (hasRecipientWithoutAmount) {
                                      Fluttertoast.showToast(
                                          msg: "All selected recipients must have an amount greater than 0.");
                                      return;
                                    } else {
                                      if (titleController.text.isNotEmpty) {
                                        bulkPay.setMessage(titleController.text);
                                      }
                                      Navigator.pushNamed(context, Routes.bulkPayValidation);
                                    }
                                  },
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
                                      const Icon(HugeIcons.strokeRoundedArrowRight01, size: 18),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'PROCEED',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
