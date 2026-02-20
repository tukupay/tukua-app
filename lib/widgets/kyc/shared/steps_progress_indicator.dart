import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import '../../../providers/providers.dart';
class StepProgressIndicator extends StatelessWidget {
  final String firstStep;
  final String secondStep;
  final String lastStep;
  final int currentStep;
  const StepProgressIndicator({super.key,
  required this.firstStep,
  required this.secondStep,
  required this.lastStep,
  required this.currentStep});

  @override
  Widget build(BuildContext context) {
    const totalSteps = 3;
    return Consumer<KycIndividualProvider>(
      builder: (_,kycProvider,__) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(totalSteps, (index) {
            final isActive = index == currentStep;
            final isComplete = index < currentStep;
            return Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isComplete
                        ? const Color(0xFFEE7D13)
                        : isActive
                        ? const Color(0xFF15411D)
                        : Colors.grey[300],
                  ),
                  child: Icon(
                    Icons.check,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
                Spaces.tinyTopSpace,
                index==0? Text(firstStep):
                index==1? Text(secondStep):
                Text(lastStep),
              ],
            );
          }),
        );
      }
    );
  }
}
