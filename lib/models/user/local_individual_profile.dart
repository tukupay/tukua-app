import 'package:isar/isar.dart';

part 'local_individual_profile.g.dart';

@Collection()
class LocalIndividualProfile {
  Id id = Isar.autoIncrement;

  late String firstName;
  late String middleName;
  late String lastName;
  late String title;
  late DateTime dob;
  late String gender;
  late String kraPin;
  late String nationalId;
  late String division;
  late String location;
  late String subLocation;
}
