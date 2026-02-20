import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:tuku/models/models.dart';
import 'package:tuku/repository/repository.dart';

class LocalUserService implements LocalUserRepository{
  late Future<Isar> isarDb;

  LocalUserService(){
    isarDb=openDb();
  }
  
  @override
  Future<LocalUserModel> saveUser(UserModel user)async{
    final db=await isarDb;
    LocalUserModel localUser=LocalUserModel()
      ..userId=user.id
      ..username=user.username
    ..email=user.email
    ..phoneNumber=user.phoneNumber
    ..type=user.type
    ..status=user.status
    ..emailVerified=user.emailVerified
    ..phoneVerified=user.phoneVerified
    ..kycStatus=user.kycStatus
    ..twoFactorEnabled=user.twoFactorEnabled
    ..acceptedTerms=user.acceptedTerms
    ..role=user.role

    ..firstName=user.individualProfile?.firstName
    ..middleName=user.individualProfile?.middleName
    ..lastName=user.individualProfile?.lastName
    ..title=user.individualProfile?.title
    ..dob=user.individualProfile?.dob.toIso8601String()
    ..gender=user.individualProfile?.gender
    ..kraPin=user.individualProfile?.kraPin
    ..nationalId=user.individualProfile?.nationalId

    ..businessName=user.businessProfile?.businessName
    ..businessType=user.businessProfile?.businessType
    ..registrationDate=user.businessProfile?.registrationDate?.toIso8601String()
    ..certificateNumber=user.businessProfile?.certificateNumber
    ..kraPin=user.businessProfile?.pinNumber

    ..lastLoginAt=user.lastLoginAt?.toIso8601String()
    ..acceptedTermsAt=user.acceptedTermsAt?.toIso8601String()
    ..createdAt=user.createdAt?.toIso8601String()
    ..updatedAt=user.updatedAt?.toIso8601String()

    ..profileImg=user.profileImgUrl

    ..requiresPinSetup=user.requiresPinSetup
    ..pinStatus=user.pinStatus

    ..posName=user.stk?.name
    ..posType=user.stk?.type
    ..posStatus=user.stk?.status
    ..posDescription=user.stk?.description
    ..posWalletId=user.stk?.walletId;

    // store within an async transaction (avoids sync API on main isolate)
    await db.writeTxn(() async {
      await db.localUserModels.put(localUser);
    });
    return localUser;
  }

  @override
  Future<LocalUserModel> updateUser(UserModel user)async{
    final db=await isarDb;

    // Find existing local user by the `userId` field instead of using list indexes.
    final existing = await db.localUserModels.filter().userIdEqualTo(user.id).findFirst();

    if (existing == null) {
      // If no local record exists, create and return a new saved record.
      return await saveUser(user);
    }else{
      // Update fields on the found object
      existing
        ..userId=user.id
        ..username=user.username
        ..email=user.email
        ..phoneNumber=user.phoneNumber
        ..type=user.type
        ..status=user.status
        ..emailVerified=user.emailVerified
        ..phoneVerified=user.phoneVerified
        ..kycStatus=user.kycStatus
        ..twoFactorEnabled=user.twoFactorEnabled
        ..acceptedTerms=user.acceptedTerms
        ..role=user.role

        ..firstName=user.individualProfile?.firstName
        ..middleName=user.individualProfile?.middleName
        ..lastName=user.individualProfile?.lastName
        ..title=user.individualProfile?.title
        ..dob=user.individualProfile?.dob.toIso8601String()
        ..gender=user.individualProfile?.gender
        ..kraPin=user.individualProfile?.kraPin
        ..nationalId=user.individualProfile?.nationalId

        ..businessName=user.businessProfile?.businessName
        ..businessType=user.businessProfile?.businessType
        ..registrationDate=user.businessProfile?.registrationDate?.toIso8601String()
        ..certificateNumber=user.businessProfile?.certificateNumber
        ..kraPin=user.businessProfile?.pinNumber

        ..lastLoginAt=user.lastLoginAt?.toIso8601String()
        ..acceptedTermsAt=user.acceptedTermsAt?.toIso8601String()
        ..createdAt=user.createdAt?.toIso8601String()
        ..updatedAt=user.updatedAt?.toIso8601String()

        ..profileImg=user.profileImgUrl

        ..requiresPinSetup=user.requiresPinSetup
        ..pinStatus=user.pinStatus

        ..posName=user.stk?.name
        ..posType=user.stk?.type
        ..posStatus=user.stk?.status
        ..posDescription=user.stk?.description
        ..posWalletId=user.stk?.walletId;
    }
    await db.writeTxn(() async {
      await db.localUserModels.put(existing);
    });

    return existing;
  }

  @override
  Future<LocalUserModel?> getUser() async{
    final db=await isarDb;
    // Return the first stored local user (or null if none). Avoid assuming id == 1.
    final user = await db.localUserModels.where().findFirst();
    return user;
  }

  /// Save/update a LocalUserModel directly (for partial field updates)
  Future<LocalUserModel> saveLocalUser(LocalUserModel localUser) async {
    final db = await isarDb;
    await db.writeTxn(() async {
      await db.localUserModels.put(localUser);
    });
    return localUser;
  }

  @override
  Future<void> clearDatabase()async{
    final db=await isarDb;
    db.writeTxnSync(()=>db.clearSync());
  }
}

Future<Isar> openDb()async{
  final dir=await getApplicationDocumentsDirectory();
  if(Isar.instanceNames.isEmpty){
    return await Isar.open([LocalUserModelSchema,LocalKycModelSchema,LocalIndividualProfileSchema,
    LocalAuthModelSchema],
        inspector: true,
        directory: dir.path);
  }else{
    Isar.getInstance()!;
    return Future.value(Isar.getInstance());
  }
}