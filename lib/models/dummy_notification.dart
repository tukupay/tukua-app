import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/models/models.dart';

class DummyNotification{
  String subject;
  String sender;
  String content;
  int time;
  bool read;
  String accentColor;
  IconData icon;

  DummyNotification({
    required this.subject,
    required this.sender,
    required this.content,
    required this.time,
    required this.read,
    required this.accentColor,
    required this.icon
});
}

List<DummyNotification> dummyNotifications=[
  DummyNotification(
      subject: 'Transaction Failed!',
      sender: 'Tuku Pay',
      content: 'Dear User, your attempt to send KES 12,100 to account 374512415 (Albert Muchene) was unsuccessful due to insufficient funds. Kindly top up and try again.',
      time: 1741099957000,
      read: false,
      accentColor: '#EE7D13',
      icon: HugeIcons.strokeRoundedInformationSquare),
  DummyNotification(
      subject: 'Car Insurance Overdue',
      sender: 'Alpine Insurance',
      content: "Dear User, there are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
      time: 1741099957000,
      read: false,
      accentColor: '#FF3B30',
      icon: HugeIcons.strokeRoundedCar04),
  DummyNotification(
      subject: 'House rent due in 10 days!',
      sender: 'Alpine Homes',
      content: "Dear User, there are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
      time: 1741099957000,
      read: false,
      accentColor: '#1E8842',
      icon: HugeIcons.strokeRoundedHome11),
  DummyNotification(
      subject: 'Electricity Bill Overdue!',
      sender: 'KPLC',
      content: "Dear User, there are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
      time: 1741099957000,
      read: false,
      accentColor: '#AF059E',
      icon: HugeIcons.strokeRoundedIdea),
  DummyNotification(
      subject: 'Transaction Failed!',
      sender: 'Tuku Pay',
      content: 'Dear User, your attempt to send KES 2,100 to account 374512415 (Robert Kanyoro) was unsuccessful due to insufficient funds. Kindly top up and try again.',
      time: 1741099957000,
      read: false,
      accentColor: '#EE7D13',
      icon: HugeIcons.strokeRoundedInformationSquare),
  DummyNotification(
      subject: 'Transaction Failed!',
      sender: 'Tuku Pay',
      content: 'Dear User, your attempt to send KES 750 to account 374512415 (Albert Muchene) was unsuccessful due to insufficient funds. Kindly top up and try again.',
      time: 1741099957000,
      read: true,
      accentColor: '#EE7D13',
      icon: HugeIcons.strokeRoundedInformationSquare),
];