import 'package:flutter/material.dart';
class MerchantApp {
  final String id;
  final String name;
  final String description;
  final String category;
  final String? icon;
  final String? iconAsset;
  final Color? bgColor;
  final bool isNew;

  const MerchantApp({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    this.icon,
    this.iconAsset,
    this.bgColor,
    this.isNew = false,
  });
}