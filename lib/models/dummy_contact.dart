import 'package:tuku/constants/constants.dart';

class GroupMember{
  int groupId;
  String userId;
  String pPic;
  String name;
  String phone;
  String description;
  int? amount;

  GroupMember({
    required this.groupId,
    required this.userId,
    required this.pPic,
    required this.name,
    required this.phone,
    required this.description,
    this.amount
});
}

List<GroupMember> groupMembers=[
  // EMPLOYEES
  GroupMember(
      groupId:1,
      userId: 'user1',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Edith Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:1,
      userId: 'user2',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Edith Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:1,
      userId: 'user3',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Edith Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:1,
      userId: 'user4',
      pPic: Strings.imageAsset('user.jpeg'),
      name: 'Edith Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:1,
      userId: 'user5',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Edith Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  // DESIGNERS
  GroupMember(
      groupId:2,
      userId: 'user6',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Lillian Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:2,
      userId: 'user7',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Lillian Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:2,
      userId: 'user8',
      pPic: Strings.imageAsset('user.jpeg'),
      name: 'Lillian Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:2,
      userId: 'user9',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Lillian Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:2,
      userId: 'user10',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Lillian Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  // CHAMA
  GroupMember(
      groupId:3,
      userId: 'user11',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Winfred Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:3,
      userId: 'user12',
      pPic: Strings.imageAsset('user.jpeg'),
      name: 'Winfred Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:3,
      userId: 'user13',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Winfred Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:3,
      userId: 'user14',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Winfred Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:3,
      userId: 'user15',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Winfred Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),

  // CHURCH GROUP
  GroupMember(
      groupId:4,
      userId: 'user16',
      pPic: Strings.imageAsset('user.jpeg'),
      name: 'Judy Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:4,
      userId: 'user17',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Judy Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:4,
      userId: 'user18',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Judy Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:4,
      userId: 'user19',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Judy Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:4,
      userId: 'user20',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Judy Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  // WOMEN CHURCH
  GroupMember(
      groupId:5,
      userId: 'user21',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Eunice Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:5,
      userId: 'user22',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Eunice Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:5,
      userId: 'user23',
      pPic: Strings.imageAsset('user.jpeg'),
      name: 'Eunice Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:5,
      userId: 'user24',
      pPic: Strings.sampleImageAsset('rev.png'),
      name: 'Eunice Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
  GroupMember(
      groupId:5,
      userId: 'user25',
      pPic: Strings.sampleImageAsset('altpic.jpeg'),
      name: 'Eunice Nandwa',
      phone: '0706xxx742',
      description: ' All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. '),
];