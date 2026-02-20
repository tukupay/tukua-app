import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';

class Blacks{
  // POPPINS
  static TextStyle largeSemiPoppins=TextStyle(
    color: Colors.black,
    fontFamily: GoogleFonts.poppins().fontFamily,
    fontSize: 30,
    fontWeight: FontWeight.w700
  );

  static TextStyle smallestBoldPoppins=TextStyle(
      color: Colors.black,
      fontSize: 12,
      fontWeight: FontWeight.w500,
      fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle smallestBolderPoppins=TextStyle(
      color: Colors.black,
      fontSize: 12,
      fontWeight: FontWeight.w800,
      fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle tinyBoldPoppins=TextStyle(
    color: Colors.black,
    fontSize: 15,
    fontWeight: FontWeight.w500,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle tinyBolderPoppins=TextStyle(
      color: Colors.black,
      fontSize: 15,
      fontWeight: FontWeight.w700,
      fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle regularSemiPoppins=TextStyle(
    color: Colors.black,
    fontSize: 18,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle regularThinPoppins=TextStyle(
    color: Colors.black,
    fontFamily: GoogleFonts.poppins().fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w200
  );

  static TextStyle mediumSemiPoppins=TextStyle(
      color: Colors.black,
      fontSize: 24,
      fontWeight: FontWeight.w600,
      fontFamily: GoogleFonts.poppins().fontFamily
  );


  // ROBOTO
  static TextStyle tinyRoboto=TextStyle(
    color: Colors.black,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.roboto().fontFamily
  );

  static TextStyle regularSemiRoboto=TextStyle(
    color: Colors.black,
    fontSize: 16,
    fontWeight: FontWeight.w700,
    fontFamily: GoogleFonts.roboto().fontFamily
  );

  static TextStyle mediumSemiRoboto=TextStyle(
    color: Colors.black,
    fontSize: 20,
    fontWeight: FontWeight.w700,
    fontFamily: GoogleFonts.roboto().fontFamily
  );
  // CODE NEXT-TRIAL
  static TextStyle regularBoldCodeNext=TextStyle(
      fontWeight: FontWeight.w700,
      fontSize: 16,
      color:Colors.black,
      fontFamily: GoogleFonts.poppins().fontFamily
  );

  // OUTFIT
  static TextStyle regularSemiOutfit=TextStyle(
    fontWeight: FontWeight.w500,
    color: Colors.black,
    fontSize: 15,
    fontFamily: GoogleFonts.outfit().fontFamily
  );

  // GROTESK
  static TextStyle tinyBoldGrotesk=TextStyle(
    fontWeight: FontWeight.w700,
    fontSize: 12,
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
    color: HexColor('#1D201E')
  );

  static TextStyle regularBoldGrotesk=TextStyle(
    fontWeight: FontWeight.w700,
    fontSize: 14,
    color: HexColor('#1D201E'),
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily
  );

  // JAKARTA
  static TextStyle tinySemiJakarta=TextStyle(
    color: Colors.black,
    fontWeight: FontWeight.w500,
    fontSize: 8,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily
  );

  static TextStyle tinyBoldJakarta=TextStyle(
    color: Colors.black,
    fontWeight: FontWeight.bold,
    fontSize: 8,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily
  );

  // RUBIK
  static TextStyle tinyRubik=TextStyle(
    color: Colors.black,
    fontSize: 12,
    fontWeight: FontWeight.w300,
    fontFamily: GoogleFonts.rubik().fontFamily
  );

  static TextStyle mediumSemiRubik=TextStyle(
    color: Colors.black,
    fontFamily: GoogleFonts.rubik().fontFamily,
    fontWeight: FontWeight.w600,
    fontSize: 20
  );

  // PUBLIC SANS
  static TextStyle regularSemiSans=TextStyle(
    color: Colors.black,
    fontSize: 15,
    fontWeight: FontWeight.w500,
    fontFamily: GoogleFonts.publicSans().fontFamily
  );

  static TextStyle regularThinSans=TextStyle(
    color: HexColor('#2D2D2D'),
    fontSize: 15
  );

  // INTER
  static TextStyle mediumThinInter=TextStyle(
    color: HexColor('#111731'),
    fontSize: 24,
    fontWeight: FontWeight.w200,
    fontFamily: GoogleFonts.inter().fontFamily
  );

  // KARLA
  static TextStyle regularKarla=TextStyle(
    color: Colors.black,
    fontFamily: GoogleFonts.karla().fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
  );
  // CAIRO
  static TextStyle regularSemiCairo=TextStyle(
    color: Colors.black,
    fontSize: 18,
    fontWeight: FontWeight.w800,
    fontFamily: GoogleFonts.cairo().fontFamily
  );

  static TextStyle regularCairo=TextStyle(
    color: Colors.black,
    fontSize: 16,
    fontWeight: FontWeight.w300,
    fontFamily: GoogleFonts.cairo().fontFamily
  );

  static TextStyle smallCairo=TextStyle(
      color: Colors.black,
      fontSize: 8,
      fontWeight: FontWeight.w300,
      fontFamily: GoogleFonts.cairo().fontFamily
  );
}