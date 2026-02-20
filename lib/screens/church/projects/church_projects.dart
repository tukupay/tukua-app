import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class ChurchProjects extends StatelessWidget {
  const ChurchProjects({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text("Projects",style: Blacks.mediumSemiPoppins),
      ),
      body: SingleChildScrollView(
        padding: Paddings.tinyAllSides,
        primary: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Spaces.smallTopSpace,
            Text("Active Fundraisers",style: Blacks.mediumSemiRubik),
            ListView.builder(
              itemCount: 8,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context,index){
                return ChurchProjectCard(
                  project: ChurchProject(
                      title: "Sample Church Activity Project",
                      goalAmount: 150000,
                      createdAt: DateTime.now(),
                      category: "Charity",
                      amountRaised: 12000,
                      publicUrl: "https://tuku.money/"),
                );
                })
          ],
        ),
      ),
    );
  }
}
