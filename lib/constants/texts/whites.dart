import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class Whites{
  // ROBOTO
  static TextStyle smallestRoboto=TextStyle(
    fontFamily: GoogleFonts.roboto().fontFamily,
    fontSize: 8,
    fontWeight: FontWeight.w700,
    color: Colors.white
  );

  static TextStyle tinyFaintRoboto=TextStyle(
    fontFamily: GoogleFonts.roboto().fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w400,
    color: Colors.white.withAlpha(50)
  );

  static TextStyle smallBoldRoboto=TextStyle(
      fontFamily: GoogleFonts.roboto().fontFamily,
      fontSize: 12,
      fontWeight: FontWeight.w900,
      color: Colors.white
  );


  static TextStyle regularRoboto=TextStyle(
    fontFamily: GoogleFonts.roboto().fontFamily,
    color: Colors.white,
    fontSize: 16,
    fontWeight: FontWeight.w400
  );

  static TextStyle regularSemiRoboto=TextStyle(
    fontFamily: GoogleFonts.roboto().fontFamily,
    color: Colors.white,
    fontWeight: FontWeight.w700,
    fontSize: 16
  );

  static TextStyle mediumBoldRoboto=TextStyle(
    fontWeight: FontWeight.w900,
    color: Colors.white,
    fontSize: 20,
    fontFamily: GoogleFonts.roboto().fontFamily
  );

  static TextStyle mediumSemiRoboto=TextStyle(
      fontWeight: FontWeight.w400,
      color: Colors.white,
      fontSize: 20,
      fontFamily: GoogleFonts.roboto().fontFamily
  );
  
  // INTER
  static TextStyle smallSemiInter=TextStyle(
    fontFamily: GoogleFonts.inter().fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: Colors.white
  );

  // GROTESK
  static TextStyle regularGrotesk=TextStyle(
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w300,
    color: Colors.white
  );

  static TextStyle largeBoldGrotesk=TextStyle(
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: Colors.white
  );

  // KARLA
  static TextStyle smallSemiKarla=TextStyle(
    color: Colors.white,
    fontFamily: GoogleFonts.karla().fontFamily,
    fontSize: 13,
    fontWeight: FontWeight.w500
  );

  static TextStyle largeKarlaBold=TextStyle(
    color: Colors.white,
    fontWeight: FontWeight.w700,
    fontFamily: GoogleFonts.karla().fontFamily,
    fontSize: 32
  );

  // POPPINS
  static TextStyle largeSemiPoppins=TextStyle(
    color: Colors.white,
    fontSize: 30,
    fontWeight: FontWeight.w700,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle tinyPoppins=TextStyle(
    color: Colors.white,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );
}