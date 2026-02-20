import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hexcolor/hexcolor.dart';

class Grays{
  // POPPINS
  static TextStyle smallestPoppinsHint=TextStyle(
    color: HexColor('#44475C'),
    fontSize: 10,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle smallestBolderPoppinsHint=TextStyle(
      color: HexColor('#44475C'),
      fontSize: 10,
      fontWeight: FontWeight.w600,
      fontFamily: GoogleFonts.poppins().fontFamily
  );
  
  static TextStyle tinyPoppinsHint=TextStyle(
    color: HexColor('#8B8B8B'),
    fontSize: 12,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle regularLightSemiPoppins=TextStyle(
    color: HexColor('#7C7C7C'),
    fontSize: 14,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle regularPoppins=TextStyle(
    color: HexColor('#2E384D'),
    fontSize: 16,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );

  static TextStyle regularBoldPoppins=TextStyle(
    color: HexColor('#BCC2CC'),
    fontSize: 14,
    fontWeight: FontWeight.w700,
    fontFamily: GoogleFonts.poppins().fontFamily
  );
  
  static TextStyle mediumPoppins=TextStyle(
    color: HexColor('#828282'),
    fontSize: 20,
    fontWeight: FontWeight.w400,
    fontFamily: GoogleFonts.poppins().fontFamily
  );
  
  // ROBOTO
  static TextStyle smallRoboto=TextStyle(
      color: HexColor('#777777'),
      fontWeight: FontWeight.w400,
      fontSize: 12,
      fontFamily: GoogleFonts.roboto().fontFamily
  );

  static TextStyle regularRoboto=TextStyle(
    color: HexColor('#777777'),
    fontWeight: FontWeight.w400,
    fontSize: 16,
    fontFamily: GoogleFonts.roboto().fontFamily
  );
  
  // GROTESK
  static TextStyle tinySemiGrotesk=TextStyle(
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
    fontSize: 12,
  fontWeight: FontWeight.w400,
  color: HexColor('#26273A99').withAlpha(150));
  
  static TextStyle smallGrotesk=TextStyle(
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: HexColor('#777777')
  );

  static TextStyle smallerGrotesk=TextStyle(
      fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
      fontSize: 11,
      fontWeight: FontWeight.w400,
      color: HexColor('#777777')
  );
  
  // INTER
  static TextStyle lightSemiInter=TextStyle(
    fontFamily: GoogleFonts.inter().fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: HexColor('#A5ACB8')
  );
  
  static TextStyle regularSemiInter=TextStyle(
    fontFamily: GoogleFonts.inter().fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: HexColor('#8E8E8E')
  );

  static TextStyle regularDarkerSemiInter=TextStyle(
      fontFamily: GoogleFonts.inter().fontFamily,
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: HexColor('#3C4257')
  );
  
  // KARLA
  static TextStyle tinySemiKarla=TextStyle(
    fontFamily: GoogleFonts.karla().fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: HexColor('#7A7A7A')
  );

  static TextStyle smallestSemiKarla=TextStyle(
      fontFamily: GoogleFonts.karla().fontFamily,
      fontSize: 8,
      fontWeight: FontWeight.w500,
      color: HexColor('#7A7A7A')
  );

  // ACME
  static TextStyle tinySemiAcme=TextStyle(
    fontFamily: GoogleFonts.acme().fontFamily,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: Colors.black26
  );
}