import 'package:tuku/constants/constants.dart';

class DummyChurch{
  String image;
  String coverImage;
  String name;
  String city;
  String aboutUs;
  String vision;
  String location;
  List coordinates;
  String head;
  double rating;
  int members;
  // List mediaPhotos;
  // List mediaVideos;

  DummyChurch({
    required this.image,
    required this.coverImage,
    required this.name,
    required this.city,
    required this.aboutUs,
    required this.vision,
    required this.location,
    required this.coordinates,
    required this.head,
    required this.rating,
    required this.members
    // required this.mediaPhotos,
    // required this.mediaVideos
  });
}

DummyChurch myChurch=DummyChurch(
    image: Strings.sampleImageAsset('alamano.jpg'),
    coverImage: Strings.sampleImageAsset('church.jpg'),
    name: 'Jubilee Christian Church',
    city: 'Thika Road',
    aboutUs: 'Welcome to Jubilee Christian Church Thika Road, a vibrant and inclusive community of believers dedicated to worship, fellowship, and service. Located at the heart of Thika Road, our church is a haven for individuals and families seeking a deeper connection with God and a supportive Christian community.',
    vision: 'At Jubilee Christian Church Thika Road, our vision is to be a beacon of hope, love, and transformation in our community. We strive to inspire and empower individuals to experience the fullness of God’s love, discover their purpose, and live meaningful, Christ-centered lives.',
    location: 'Nairobi,Kenya',
    coordinates: [-1.048615, 37.068771],
    head: 'Rev. Morris Gacheru',
    rating: 4.5,
    members: 1500);

