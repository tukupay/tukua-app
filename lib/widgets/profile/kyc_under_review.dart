import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class KycUnderReview extends StatelessWidget {
  const KycUnderReview({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // "Back to Profile" Icon + Text
          Row(
            children: [
              IconButton(
                icon: Icon(Icons.arrow_back, color: HexColor('15411D')),
                onPressed: () {
                  Navigator.of(context).pop(); // Navigate back to the profile
                },
              ),
              SizedBox(width: 8),
              Text(
                'Back to Profile',
                style: Greens.mediumSemiInter
              ),
            ],
          ),
          SizedBox(height: 16),

          // Main Card for "Under Review" Status
          Card(
            elevation: 4, // A bit more prominent shadow to make it stand out
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: HexColor('F1F5F9'), // Soft background color for better contrast
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Content: Message about KYC under review
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Your docs are under review",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: HexColor('15411D'),
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        "We will notify you of any updates.",
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),

                  // Delete Icon
                  IconButton(
                    icon: Icon(
                      Icons.delete_forever,
                      color: Colors.redAccent,
                    ),
                    onPressed: () {
                      Fluttertoast.showToast(msg: 'To Delete');
                    },
                  ),
                ],
              ),
            ),
          ),

          SizedBox(height: 20),

          // Optional: Some subtle animation or a decorative line to add flair
          AnimatedContainer(
            duration: Duration(seconds: 1),
            curve: Curves.easeInOut,
            width: double.infinity,
            height: 3,
            color: HexColor('15411D').withOpacity(0.2), // Subtle green bar for emphasis
          ),
        ],
      ),
    );
  }
}
