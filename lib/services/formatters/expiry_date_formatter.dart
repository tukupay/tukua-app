import 'package:flutter/services.dart';

class ExpiryDateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue,
      TextEditingValue newValue,
      ) {
    String newText = newValue.text;

    // Remove all non-digit characters (in case user manually removes "/")
    newText = newText.replaceAll(RegExp(r'[^0-9]'), '');

    // If the length is greater than 2, we insert the slash after the first 2 digits
    if (newText.length >= 2 && !newText.contains('/')) {
      newText = '${newText.substring(0, 2)}/${newText.substring(2)}';
    }

    // Limit length to 7 characters (MM/YYYY)
    if (newText.length > 7) {
      newText = newText.substring(0, 7); // Only allow MM/YYYY
    }

    // Calculate cursor position: If the user typed a digit after the slash, move the cursor to the correct position
    int cursorPosition = newValue.selection.baseOffset;

    // If cursor is within the first 2 digits, leave it there
    // If cursor is after the slash, move it correctly
    if (cursorPosition > 2 && cursorPosition <= newText.length) {
      cursorPosition = newText.length; // Keep it at the end of the text
    }

    // Return the formatted text with correct cursor position
    return TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: cursorPosition),
    );
  }
}
