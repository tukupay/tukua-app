import 'dart:ui';

import 'package:isar/isar.dart';
import 'package:tuku/repository/repository.dart';
import '../../models/models.dart';
import '../services.dart';
class LocalAuthService implements LocalAuthRepository{

  late Future<Isar> isarDb;

  LocalAuthService(){
    isarDb=openDb();
  }


  @override
  Future<void> saveAuth(String pass, String access, String refresh)async{
    final db=await isarDb;
    LocalAuthModel auth=LocalAuthModel()
      ..phrase=pass
      ..accessToken=access
      ..refreshToken=refresh;
    db.writeTxnSync(()=>db.localAuthModels.putSync(auth));
  }


  @override
  Future<LocalAuthModel> updateTokens(String access, String refresh)async{
    final db=await isarDb;
    LocalAuthModel? auth=await db.localAuthModels.get(1);
    auth!
      ..accessToken=access
      ..refreshToken=refresh;
    db.writeTxnSync(()=>db.localAuthModels.putSync(auth));
    return auth;
  }


  @override
  Future<String?> accessToken()async{
    final db=await isarDb;
    final record=await db.localAuthModels.get(1);
    return record?.accessToken;
  }

  @override
  Future<String?> refreshToken()async{
    final db=await isarDb;
    final record=await db.localAuthModels.get(1);
    return record?.refreshToken;
  }

  @override
  Future<String?> passPhrase()async{
    final db=await isarDb;
    final record=await db.localAuthModels.get(1);
    return record?.phrase;
  }

  @override
  Future<void> clearTokens()async{
    final db=await isarDb;
    await db.localAuthModels.clear();
  }

}