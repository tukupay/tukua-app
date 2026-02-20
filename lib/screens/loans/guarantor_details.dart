import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';

import '../../providers/providers.dart';
class GuarantorDetails extends StatelessWidget {
  const GuarantorDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final nameController=TextEditingController();
    final idController=TextEditingController();
    final phoneController=TextEditingController();
    final emailController=TextEditingController();
    final cityController=TextEditingController();
    final addressController=TextEditingController();
    return PopScope(
      onPopInvokedWithResult: (bool b,res){
        Provider.of<LoanProvider>(context,listen: false).goToStep(loanSteps[1]);
      },
      child: SizedBox(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Name',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  initialText: 'Alice Kimani',
                  hint: 'Guarantor\'s name'),
              Spaces.smallTopSpace,
              Text('ID NO',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  initialText: '36484938',
                  hint: 'Guarantor\'s ID number'),
              Spaces.smallTopSpace,
              Text('Phone NO',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  initialText: '+254 72342636',
                  hint: 'Guarantor\'s phone number'),
              Spaces.smallTopSpace,
              Text('Email',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  initialText: 'Alicekimani@gmail.com',
                  hint: 'Guarantor\'s email'),
              Spaces.smallTopSpace,
              Text('Address',style: Blacks.smallestBolderPoppins),
              Spaces.tinyTopSpace,
              LoanTextField(
                  initialText: 'Ongata Rongai, Kajiado North',
                  hint: 'Guarantor\'s home address'),
              Spaces.smallTopSpace,
            ],
          ),
        ),
      )
    );
  }
}
