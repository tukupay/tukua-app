import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:provider/provider.dart';
import 'package:tuku/providers/providers.dart';
import 'package:tuku/widgets/widget.dart';

import '../../constants/constants.dart';
import '../../models/models.dart';
class UserDetails extends StatelessWidget {
  const UserDetails({super.key});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return Consumer<ProfileProvider>(
      builder: (_,profile,__) {
        String? firstName=profile.user?.firstName;
        String? lastName=profile.user?.lastName;
        String? fullName='$firstName $lastName';
        return SizedBox(
          width: size.width,
          child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  height:160,
                  width: 160,
                  decoration: BoxDecoration(
                      border: Border.all(
                          color: HexColor('#EE7D13')
                      ),
                      shape: BoxShape.circle
                  ),
                  alignment: Alignment.center,
                  child: Container(
                    height: 155,width: 155,
                    decoration: BoxDecoration(
                        image: DecorationImage(
                            image:
                            profile.user?.profileImg!=null?
                                NetworkImage(profile.user!.profileImg!):
                            AssetImage(Strings.imageAsset('user.jpeg')),
                            fit: BoxFit.cover),
                        shape: BoxShape.circle
                    ),
                  ),
                ),
                Spaces.smallSideSpace,
                Flexible(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Spaces.mediumTopSpace,
                      profile.user?.type==Strings.individualAcc?
                      Text(profile.user?.firstName!=null?fullName:'Your Name',
                          style: Blacks.mediumSemiRoboto):
                          profile.user?.type==Strings.businessAcc?
                      Text(profile.user?.businessName??'Your Name',style: Blacks.mediumSemiRoboto,
                      overflow: TextOverflow.ellipsis):
                          Text('Your Name',style: Blacks.mediumSemiRoboto),
                      Text(profile.user?.phoneNumber?? 'Your Phone',
                          style: Grays.regularRoboto),
                      Text(profile.user?.email??'',style: Grays.smallRoboto)
                    ],
                  ),
                )
              ],
            ),
        );
      }
    );
  }
}
