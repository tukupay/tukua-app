import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';

class AppTheme{
  static ThemeData theme=ThemeData(
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      foregroundColor: Colors.white,
      iconTheme: IconThemeData(color: Colors.black),
    ),
    colorScheme: ColorScheme.fromSeed(
        seedColor: HexColor(AppColors.primaryGreen),
        primary: HexColor(AppColors.primaryGreen)),
    scaffoldBackgroundColor: Colors.white,
    inputDecorationTheme: InputDecorationTheme(
        enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(
                color: HexColor('BDBDBD')
            )
        ),
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: HexColor(AppColors.primaryGreen)
    ),
    // circular indicator theme
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: HexColor(AppColors.primaryGreen),
      linearTrackColor: HexColor(AppColors.fadedGreen)
    ),
    // dropdown theme
    dropdownMenuTheme: DropdownMenuThemeData(
      inputDecorationTheme: InputDecorationTheme(
        border: UnderlineInputBorder(
          borderSide: BorderSide(
            color: HexColor(AppColors.lightGray)
          )
        )
      ),
        menuStyle: MenuStyle(
          elevation: WidgetStatePropertyAll(2),
          backgroundColor: WidgetStatePropertyAll(Colors.white),
          padding: WidgetStatePropertyAll(EdgeInsets.zero),
          side: WidgetStatePropertyAll(BorderSide(
            color: HexColor(AppColors.lightGray),
          ))
        )
    ),
    // other theme
    datePickerTheme: DatePickerThemeData(
      // Foreground color for the day, including selected state
      dayForegroundColor: WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> states) {
        if (states.contains(WidgetState.selected)) {
          // **IMPORTANT for visibility**: This color needs to contrast with the dayBackgroundColor
          // If your dayBackgroundColor (circle) is Colors.blue, then white or a light color is good.
          // If your dayBackgroundColor (circle) is AppColors.primaryGreen,
          // and primaryGreen is dark, then Colors.white or a light color is good.
          // If primaryGreen is light, then Colors.black or a dark color is good.
          return Colors.red; // Color for the selected date's text
        }
        if (states.contains(WidgetState.disabled)) {
          return Colors.grey[400]; // Color for disabled dates' text
        }
        // For other states (e.g. today but not selected, normal days)
        // Return null to use the default from ColorScheme.onSurface (usually black or dark grey)
        return null;
      }),
      // Background color for the day, especially the selected day's circle
      dayBackgroundColor: WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> states) {
        if (states.contains(WidgetState.selected)) {
          // THIS IS THE COLOR OF THE CIRCLE for the selected date
          return HexColor(AppColors.primaryGreen); // Or your desired Colors.blue, etc.
        }
        // For other states (e.g. normal days), return null to have no specific background
        // or a transparent background, so the dialog's background shows through.
        return null;
      }),

      // You might also want to style the current day (today) if it's not selected
      // For example, give it a border or a subtle background tint
      todayForegroundColor: WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> states) {
        if (states.contains(WidgetState.selected)) {
          // If today is also selected, use the selected color from dayForegroundColor
          return Colors.red; // Or whatever you set for selected day text
        }
        // If today is NOT selected, this is its text color
        return HexColor(AppColors.primaryGreen); // Example: make today's date text green
      }),
      todayBackgroundColor: WidgetStateProperty.resolveWith<Color?>((Set<WidgetState> states) {
        // If today is selected, the dayBackgroundColor for selected state will take over for the circle.
        // This is for when "today" is NOT selected.
        // If you want a subtle background for "today" when it's not selected:
        // return Colors.grey[200];
        return null; // Usually no special background for today if not selected, just the text color
      }),
    ),
  );
}