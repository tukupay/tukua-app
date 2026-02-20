import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';
class UserStats extends StatelessWidget {
  const UserStats({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer3<WalletProvider,TransactionsProvider,BankingProvider>(
      builder: (_,wallets,transactions,banking,__) {
        return Container(
          height: 60,
          width: size.width,
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              StatItem(value: wallets.userWallets.length, title: 'Wallets'),
              StatItem(value: banking.userBanks.length, title: 'Banks'),
              StatItem(value: transactions.summary?.totalTransactions??0, title: 'Transactions')
            ],
          ),
        );
      }
    );
  }
}
