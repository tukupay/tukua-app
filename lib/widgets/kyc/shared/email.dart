import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/textfields/auth_text_field.dart';
class Email extends StatelessWidget {
  const Email({super.key});

  @override
  Widget build(BuildContext context) {

    return Consumer2<AuthProvider,ProfileProvider>(
      builder: (_,auth,profile,__) {
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: const Icon(Icons.email_rounded, size: 40, color: Color(0xFF15411D))),
              const SizedBox(height: 12),
              Center(
                child: const Text(
                  "Add Email & Username",
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  "This will be used for:\n• Creating wallets \n• Password resets\n• Receipts & Notifications",
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 28),
              Text('Your email',style: Blacks.smallestBolderPoppins),
              AuthTextField(hint: 'your@email.com',
                controller: auth.emailController),
              Spaces.smallTopSpace,
              Text('Your username',style: Blacks.smallestBolderPoppins),
              AuthTextField(
                  goNext: false,
                  hint: profile.user?.username??'yourname',
                  controller: auth.usernameController)
            ],
          ),
        );
      }
    );
  }
}
