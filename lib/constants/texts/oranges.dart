import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';

class Oranges{
  // NUNITO
  static TextStyle largeTitle=TextStyle(
    color: HexColor('#E85D1C'),
    fontFamily: GoogleFonts.nunito().fontFamily,
    fontWeight: FontWeight.bold,
    fontSize: 28
  );
  
  // POPPINS
  static TextStyle tinyPoppins=TextStyle(
    color: HexColor('#F79515'),
    fontSize: 13,
    fontWeight: FontWeight.w500,
    fontFamily: GoogleFonts.poppins().fontFamily
  );
  
  static TextStyle smallSemiPoppins=TextStyle(
    color: HexColor('#FF9F39'),
    fontSize: 16,
    fontWeight: FontWeight.w600,
    fontFamily: GoogleFonts.poppins().fontFamily,
  );

  // KARLA
  static TextStyle underlinedSmallSemiKarla=TextStyle(
    color: HexColor('#EE7D13'),
    fontSize: 14,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.karla().fontFamily,
    decoration: TextDecoration.underline,
    decorationColor: HexColor('#EE7D13'),
  );
  
  // INTER
  static TextStyle regularSemiInter=TextStyle(
    color: HexColor('#EE7D13'),
    fontWeight: FontWeight.w500,
    fontSize: 18,
    fontFamily: GoogleFonts.inter().fontFamily
  );

  // ROBOTO
  static TextStyle smallestRoboto=TextStyle(
    color: HexColor('EE7D13'),
    fontSize: 8,
    fontFamily: GoogleFonts.roboto().fontFamily,
    fontWeight: FontWeight.w500
  );

  static TextStyle tinySemiRoboto=TextStyle(
    color: HexColor('#EE7D13'),
    fontFamily: GoogleFonts.roboto().fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w700
  );
}