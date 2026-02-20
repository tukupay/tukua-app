import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class SettingItem extends StatelessWidget {
  final String setting;
  final bool value;
  final ValueChanged<bool>? onChanged;

  const SettingItem({
    super.key,
    required this.setting,
    required this.value,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(setting, style: Blacks.regularCairo, overflow: TextOverflow.ellipsis),
          ),
          Switch(
            activeColor: HexColor('#E85D1C'),
            activeTrackColor: HexColor('#E85D1C'),
            trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
            inactiveTrackColor: HexColor('#3C3C43').withAlpha(120),
            thumbColor: WidgetStatePropertyAll(HexColor('#D1D1D6')),
            value: value,
            onChanged: onChanged,
          )
        ],
      ),
    );
  }
}
