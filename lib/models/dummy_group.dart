import 'package:tuku/constants/constants.dart';

class DummyGroup{
  int id;
  String name;
  int members;
  String description;

  DummyGroup({
    required this.id,
    required this.name,
    required this.members,
    required this.description
});
}
List<DummyGroup> dummyGroups=[
  DummyGroup(
      id: 1,
      name: 'Employees',
      members: 12,
      description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.'),
  DummyGroup(
      id: 2,
      name: 'Designers',
      members: 12,
      description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.'),
  DummyGroup(
      id: 3,
      name: 'Mama Chama',
      members: 12,
      description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.'),
  DummyGroup(
      id: 4,
      name: 'Church Group 1',
      members: 12,
      description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.'),
  DummyGroup(
      id: 5,
      name: 'Women Church',
      members: 12,
      description: 'The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. '),
];