import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';

class RegType extends StatelessWidget {
  const RegType({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width/1.2,
      child: Consumer<AuthProvider>(
        builder: (_, auth, __) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Individual Radio
              Flexible(
                child: RadioListTile<String>(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  visualDensity: VisualDensity(horizontal: -4, vertical: -4),
                  activeColor: HexColor(AppColors.primaryOrange),
                  title: Text('Individual', style: TextStyle(fontSize: 14)),
                  value: Strings.individualAcc,
                  groupValue: auth.accType,
                  onChanged: (value) =>
                      Provider.of<AuthProvider>(context, listen: false).setAccType(value!),
                ),
              ),

              // Business Radio
              Flexible(
                child: RadioListTile<String>(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  visualDensity: VisualDensity(horizontal: -4, vertical: -4),
                  activeColor: HexColor(AppColors.primaryOrange),
                  title: Text('Business', style: TextStyle(fontSize: 14)),
                  value: Strings.businessAcc,
                  groupValue: auth.accType,
                  onChanged: (value) =>{
                    Provider.of<AuthProvider>(context, listen: false).setAccType(value!)
                    // Fluttertoast.showToast(msg: 'TODO biz signup')
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
