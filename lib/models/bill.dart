import 'package:flutter/material.dart';
import 'package:tuku/constants/constants.dart';

class Bill{
  String category;
  String title;
  int amount;
  bool paid;
  int dueDate;
  IconData icon;
  String shade;
  String status;

  Bill({
    required this.category,
    required this.title,
    required this.amount,
    required this.paid,
    required this.dueDate,
    required this.icon,
    required this.shade,
    required this.status
});
}

List<Bill> myBills=[
  Bill(
      category: 'Airtime',
      title: 'Safaricom',
      amount: 5000,
      paid: false,
      dueDate: 1736366277000,
      icon: Icons.phone_android_outlined,
      shade: '#FF6240',
      status: Strings.overdueStatus),
  Bill(
      category: 'Housing',
      title: 'Monthly Rent',
      amount: 10000,
      paid: false,
      dueDate: 1736366277000,
      icon: Icons.home_filled,
      shade: '#1E8842',
      status: Strings.upcomingStatus),
  Bill(
      category: 'Electricity',
      title: 'Monthly Power Bill',
      amount: 1000,
      paid: true,
      dueDate: 1736366277000,
      icon: Icons.lightbulb,
      shade: '#AF059E',
      status: Strings.paidStatus),
  Bill(
      category: 'Health',
      title: 'NHIF Monthly Bill',
      amount: 1250,
      paid: false,
      dueDate: 1736366277000,
      icon: Icons.health_and_safety,
      shade: '#217AFF',
      status: Strings.upcomingStatus),
  Bill(
      category: 'Water',
      title: 'NAWASCO',
      amount: 1000,
      paid: true,
      dueDate: 1736366277000,
      icon: Icons.water_drop,
      shade: '#EE7D13',
      status: Strings.overdueStatus),
  Bill(
      category: 'Education',
      title: 'Cyber security course',
      amount: 42000,
      paid: false,
      dueDate: 1736366277000,
      icon: Icons.school_rounded,
      shade: '#E338FF',
      status: Strings.upcomingStatus),

];