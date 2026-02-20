import 'package:isar/isar.dart';

part 'local_business_profile.g.dart';

@Collection()
class LocalBusinessProfile {
  Id id = Isar.autoIncrement;

  late String name;
  late String businessType;
  late DateTime registrationDate;
  late String certificateNumber;
  late String pinNumber;

}
