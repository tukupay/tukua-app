import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tuku/repository/repository.dart';
import 'package:tuku/services/services.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../routes.dart';

class EntryPointScreen extends StatelessWidget {
  const EntryPointScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final LocalUserRepository local = LocalUserService();

    return FutureBuilder<LocalUserModel?>(
      future: local.getUser(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final user = snapshot.data;

        // no local user obj
        if (user == null) {
          final prefs = SharedPreferences.getInstance();
          return FutureBuilder(
            future: prefs,
            builder: (context, prefsSnap) {
              if (!prefsSnap.hasData) {
                return const SizedBox.shrink();
              }
              final lastPage = prefsSnap.data!.getString('page');
              WidgetsBinding.instance.addPostFrameCallback((_) {
                Navigator.pushReplacementNamed(
                  context,
                  lastPage != null ? Routes.verifyPhone : Routes.login,
                );
              });
              return const SizedBox.shrink();
            },
          );
        }

        // if user is individual
        if (user.type == Strings.individualAcc) {
          final missingKyc =
              user.firstName == null || user.profileImg == null;

          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacementNamed(
              context,
              missingKyc ? Routes.kycIndividualSetup : Routes.home,
            );
          });
        }

        // if user is business
        else if (user.type == Strings.businessAcc) {
          final missingKyc =
              user.certificateNumber == null ||
                  user.kraPin == null ||
                  user.profileImg == null;

          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacementNamed(
              context,
              missingKyc ? Routes.kycBusinessSetup : Routes.home,
            );
          });
        }

        // fallback
        else {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacementNamed(context, Routes.login);
          });
        }

        return const SizedBox.shrink();
      },
    );
  }
}
