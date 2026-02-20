import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class IdDetails extends StatelessWidget {
  const IdDetails({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HexColor("F9F9F9"), // Light background for softness
      body: Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 25),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title Row: Back Button + Identity Verified
              Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back, color: HexColor('15411D')),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  SizedBox(width: 10),
                  Text(
                    "Identity Verified",
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: HexColor('15411D'),
                    ),
                  ),
                ],
              ),
              Spaces.smallTopSpace,
              Divider(thickness: 1, color: Colors.grey[300]),
              Spaces.smallTopSpace,

              // Individual Info Cards with Icons
              infoCard(Icons.person, "Full Name", 'JOHN DOE'),
              infoCard(Icons.calendar_today, "Date of Birth", '14/06/1974'),
              infoCard(Icons.transgender, "Gender", 'MALE'),
              infoCard(Icons.location_on, "Location", 'Kajiado North'),
              infoCard(Icons.location_city, "Sublocation", 'Ongata Rongai'),
            ],
          ),
        ),
      ),
    );
  }

  // Reusable Card Widget for each info section with icons
  Widget infoCard(IconData icon, String label, String value) {
    return Card(
      elevation: 3, // Slight shadow for depth
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 16), // Space between cards
      color: Colors.white, // White background for cards
      child: Padding(
        padding: const EdgeInsets.all(18.0),
        child: Row(
          children: [
            // Icon background with subtle shadow and rounded corners
            Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                color: HexColor('E9F5E5'),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    blurRadius: 4,
                    offset: Offset(0, 2), // slight shadow below icon
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: HexColor('15411D'),
                size: 24,
              ),
            ),
            SizedBox(width: 14),
            // Info Text with Label and Value
            Expanded(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Label Styling
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  // Value Styling
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
