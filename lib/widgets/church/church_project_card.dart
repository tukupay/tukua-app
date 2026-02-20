import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/routes.dart';
import 'package:tuku/widgets/widget.dart';

// Assuming you have a ChurchProject model like this.
// You would move this to your models folder.
class ChurchProject {
  final String title;
  final double goalAmount;
  final String? coverPhotoUrl;
  final DateTime createdAt;
  final String category;
  final double amountRaised;
  final String publicUrl;

  ChurchProject({
    required this.title,
    required this.goalAmount,
    this.coverPhotoUrl,
    required this.createdAt,
    required this.category,
    required this.amountRaised,
    required this.publicUrl,
  });
}

class ChurchProjectCard extends StatelessWidget {
  final ChurchProject project;

  const ChurchProjectCard({super.key, required this.project});

  @override
  Widget build(BuildContext context) {
    final profile = Provider.of<ProfileProvider>(context, listen: false).user;

    return ProjectDisplayCard(
      title: project.title,
      targetAmount: 'Ksh ${formatThousands(amount: project.goalAmount, noDecimal: true)}',
      coverImage: project.coverPhotoUrl != null
          ? NetworkImage(project.coverPhotoUrl!)
          : AssetImage(Strings.sampleImageAsset('donate.jpg')) as ImageProvider,
      creatorName: profile?.type == Strings.individualAcc
          ? '${profile?.firstName} ${profile?.lastName}'
          : profile?.businessName ?? 'Church Admin',
      creatorImage: profile?.profileImg == null
          ? AssetImage(Strings.imageAsset('user.jpeg')) as ImageProvider
          : NetworkImage(profile!.profileImg!),
      creationDate: DateFormat.yMMMEd().format(project.createdAt),
      category: project.category,
      progressPercentage: '${(project.amountRaised / project.goalAmount * 100).toInt()}%',
      collectedAmount: project.amountRaised.toInt(),
      targetAmountForProgress: project.goalAmount.toInt(),
      shareableLink: project.publicUrl,
      onTap: () {
        // TODO: Navigate to Church Project Details screen
        Fluttertoast.cancel();
        Fluttertoast.showToast(msg: "To Project Details");
        // Example:
        // Provider.of<ChurchProvider>(context, listen: false).selectProject(project);
        // Navigator.pushNamed(context, Routes.churchProjectDetails);
      },
    );
  }
}
