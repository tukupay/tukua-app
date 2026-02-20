import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
import '../widget.dart';
class RecentTransactions extends StatelessWidget {
  const RecentTransactions({super.key});

  @override
  Widget build(BuildContext context) {
    return MenuCard(
        title: 'Recent Transactions',
        isList: true,
        hasAction: true,
        tapped: (){
          Navigator.pushNamed(context, Routes.allTransactions);
        },
        child: Consumer<TransactionsProvider>(
          builder: (_,transactions,__) {
            return SizedBox(
              child: transactions.loadingSummary ?
                  const TransactionsShimmer():
                  transactions.summary==null||
              transactions.summary!.recentTransactions.isEmpty?
                  _buildEmptyPlaceholder():
              ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: transactions.summary?.recentTransactions.length,
                  primary: false,
                  shrinkWrap: true,
                  itemBuilder: (context,index){
                  Transaction transaction=transactions.summary!.recentTransactions[index];
                  return TransactionCard(transaction: transaction);
                  }),
            );
          }
        ));
  }

  Widget _buildEmptyPlaceholder() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: HexColor(AppColors.primaryGreen).withAlpha(12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              HugeIcons.strokeRoundedExchange01,
              size: 36,
              color: HexColor(AppColors.primaryGreen).withAlpha(160),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'No transactions yet',
            style: Blacks.tinyBolderPoppins,
          ),
          const SizedBox(height: 4),
          Text(
            'Your transactions will appear here once you start transacting',
            style: Grays.smallestPoppinsHint,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
