import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
class EmptyPlaceholder extends StatelessWidget {
  const EmptyPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Spaces.largeTopSpace,
        Text('Nothing to display',style: Grays.smallRoboto),
        Spaces.smallTopSpace,
        Image.asset(Strings.imageAsset('empty.png'),height: 200),
        Spaces.smallTopSpace,
        Text('Select a group to display members & input amounts to send',style: Grays.smallestPoppinsHint)
      ],
    );
  }
}
