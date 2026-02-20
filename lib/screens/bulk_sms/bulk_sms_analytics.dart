import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
import '../../providers/providers.dart';

class BulkSmsAnalytics extends StatelessWidget {
  const BulkSmsAnalytics({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: Paddings.smallAllSides,
      child: Consumer<SmsProvider>(
        builder: (_,sms,__) {
          return sms.loadingStats?
              const Center(child: CircularProgressIndicator()):
              SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(HugeIcons.strokeRoundedMessageQuestion),
                        Spaces.tinySideSpace,
                        Text("Here is a breakdown of your sms usage",style: Blacks.regularSemiRoboto),
                      ],
                    ),
                    Spaces.mediumTopSpace,
                    KycInfoDetail(title: "Total SMS", content: '${sms.stats?.totalSms??0}'),
                    KycInfoDetail(title: "Delivered SMS", content: '${sms.stats?.delivered??0}',textColor: AppColors.primaryGreen),
                    KycInfoDetail(title: "Failed SMS", content: '${sms.stats?.failed??0}',textColor: AppColors.red),
                    KycInfoDetail(title: "Pending SMS", content: '${sms.stats?.pending??0}',textColor: AppColors.primaryOrange),
                    KycInfoDetail(title: "Success Rate", content: '${sms.stats?.successRate??0}%'),
                    KycInfoDetail(title: "Failure Rate", content: '${sms.stats?.failureRate??0}%'),
                    KycInfoDetail(title: "Last SMS On", content: formatDate(sms.stats?.lastSmsDate??DateTime.now(),shorter: true)),
                    KycInfoDetail(title: "Common Recipient", content: sms.stats?.mostCommonRecipient??'-')
                  ]
                ),
              );
        }
      ),
    );
  }
}
