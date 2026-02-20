import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';

import '../../constants/constants.dart';
class Steppers extends StatelessWidget {
  const Steppers({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    const totalSteps=2;
    return Container(
      width: size.width,
      color: Colors.white.withAlpha(45),
      child: Consumer<WalletProvider>(
        builder: (_,walletProvider,__) {
          return Stack(
            alignment: Alignment.center,
            children: [
              // Connecting line
              Positioned(
                top: 15, // Adjust to vertically align with the icons
                left: size.width * 0.1, // 30% from left
                right: size.width * 0.1, // 30% from right
                child: Container(
                  height: 2,
                  color: Colors.grey[300],
                ),
              ),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(totalSteps, (index){
                  final isActive=index==walletProvider.currentStep;
                  final isComplete=index<walletProvider.currentStep;
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
                      index==0? Text('Wallet Details'):
                     Text('Signatories')
                    ],
                  );
                }),
              ),
            ],
          );
        }
      ),
    );
  }
}
