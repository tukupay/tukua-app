import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';

class Reds{
  // INTER
  static TextStyle tinyInter=TextStyle(
    color: HexColor('#F05B2A'),
    fontSize: 8,
    fontWeight: FontWeight.w600,
    fontFamily: GoogleFonts.inter().fontFamily
  );
  
  static TextStyle regularSemiInter=TextStyle(
    color: HexColor('#FC0202'),
    fontSize: 14,
    fontWeight: FontWeight.w500,
    fontFamily: GoogleFonts.inter().fontFamily
  );
  
  // ROBOTO
  static TextStyle tinySemiRoboto=TextStyle(
    color: HexColor('FC0202'),
    fontSize: 10,
    fontWeight: FontWeight.w700,
    fontFamily: GoogleFonts.roboto().fontFamily
  );
}