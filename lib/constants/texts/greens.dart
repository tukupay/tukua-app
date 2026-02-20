import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';

class Greens{
  // CODE NEXT & POPPINS
  static TextStyle regularBoldCodeNext=TextStyle(
    fontWeight: FontWeight.w700,
    fontSize: 16,
    color: HexColor('#007B5D'),
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  // INTER
  static TextStyle tinyInter=TextStyle(
    fontFamily: GoogleFonts.inter().fontFamily,
    fontWeight: FontWeight.w600,
    color: HexColor('#148947'),
    fontSize: 8
  );

  static TextStyle smallBoldInter=TextStyle(
    fontFamily: GoogleFonts.inter().fontFamily,
    color: HexColor('#15411D'),
    fontSize: 12,
    fontWeight: FontWeight.w700
  );
  
  static TextStyle regularInter=TextStyle(
    fontWeight: FontWeight.w500,
    fontSize: 16,
    fontFamily: GoogleFonts.inter().fontFamily,
    color: HexColor('#15411D')
  );
  
  static TextStyle mediumSemiInter=TextStyle(
    fontWeight: FontWeight.w700,
    fontSize: 25,
    color: HexColor('#15411D'),
    fontFamily: GoogleFonts.inter().fontFamily
  );
  
  // JAKARTA
  static TextStyle smallBoldJakarta=TextStyle(
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w800,
    color: HexColor('#00533D')
  );

  // ROBOTO
  static TextStyle tinySemiRoboto=TextStyle(
    fontFamily: GoogleFonts.roboto().fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: HexColor('#15411D')
  );
  
  static TextStyle regularSemiRoboto=TextStyle(
    color: HexColor('#15411D'),
    fontSize: 16,
    fontWeight: FontWeight.w600,
    fontFamily: GoogleFonts.roboto().fontFamily
  );

  static TextStyle underlinedRegularSemiRoboto=TextStyle(
      color: HexColor('#15411D'),
      fontSize: 16,
      fontWeight: FontWeight.w600,
      fontFamily: GoogleFonts.roboto().fontFamily,
    decoration: TextDecoration.underline
  );
}