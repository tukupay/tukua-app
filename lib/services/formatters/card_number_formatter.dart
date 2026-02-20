import 'package:flutter/services.dart';

class CardNumberFormatter extends TextInputFormatter {@override
TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
    ) {
  // 1. Get the raw digits from the new value
  String newTextDigits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

  // 2. If all digits were removed, return empty
  if (newTextDigits.isEmpty) {
    return const TextEditingValue(
      text: '',
      selection: TextSelection.collapsed(offset: 0),
    );
  }

  // 3. Limit to 16 digits (standard for most cards)
  if (newTextDigits.length > 16) {
    newTextDigits = newTextDigits.substring(0, 16);
  }

  // 4. Format the digits with spaces
  StringBuffer formattedText = StringBuffer();
  for (int i = 0; i < newTextDigits.length; i++) {
    formattedText.write(newTextDigits[i]);
    if ((i + 1) % 4 == 0 && (i + 1) != newTextDigits.length) {
      formattedText.write(' '); // Add space after every 4 digits, but not at the end
    }
  }

  // 5. Calculate new cursor position
  // This is the tricky part. We need to account for spaces added/removed.
  int newCursorOffset = newValue.selection.baseOffset;
  String newFormattedString = formattedText.toString();

  // Count how many non-digit characters (spaces) are before the cursor in the new formatted text
  // The raw text in `newValue.text` might still have spaces from previous formatting
  // or the user might be typing spaces.

  // Let's analyze the change in number of digits
  final oldDigitsLength = oldValue.text.replaceAll(RegExp(r'[^0-9]'), '').length;
  final newDigitsLength = newTextDigits.length;

  if (newFormattedString.length == newValue.text.length) {
    // If the formatted string length is the same as what the user typed (e.g., they typed a space correctly)
    // keep the cursor position as is relative to the input.
    newCursorOffset = newValue.selection.baseOffset;
  } else {
    // The cursor needs adjustment due to formatting changes (spaces added/removed automatically)
    int originalCursorInRawDigits = 0;
    int rawDigitCharsBeforeCursor = 0;

    for (int i = 0; i < newValue.selection.baseOffset; i++) {
      if (RegExp(r'[0-9]').hasMatch(newValue.text[i])) {
        rawDigitCharsBeforeCursor++;
      }
    }
    originalCursorInRawDigits = rawDigitCharsBeforeCursor;

    // Find the position in the new formatted string based on the count of raw digits
    int currentDigitCount = 0;
    int finalCursorPos = 0;
    for (int i = 0; i < newFormattedString.length; i++) {
      finalCursorPos = i + 1; // Assume cursor moves after the character
      if (RegExp(r'[0-9]').hasMatch(newFormattedString[i])) {
        currentDigitCount++;
      }
      if (currentDigitCount == originalCursorInRawDigits) {
        // If we are deleting a space, the cursor might need to be before the space.
        // This happens if the character at original cursor in newValue.text was a space
        // and we deleted the digit before it.
        if (newValue.selection.baseOffset > 0 &&
            newValue.selection.baseOffset <= newValue.text.length &&
            newValue.text[newValue.selection.baseOffset -1] == ' ' &&
            newDigitsLength < oldDigitsLength) { // Deleting
          finalCursorPos = i; // Place cursor before the just-deleted space's original spot
        }
        break;
      }
    }
    newCursorOffset = finalCursorPos;

    // Special case: if user deletes the last character and it was a space separator.
    // E.g., from "1234 " to "1234"
    if (oldValue.text.length > newFormattedString.length &&
        oldValue.text.endsWith(' ') &&
        !newFormattedString.endsWith(' ') &&
        newCursorOffset > newFormattedString.length) {
      newCursorOffset = newFormattedString.length;
    }
  }


  // Ensure cursor is within bounds
  if (newCursorOffset > newFormattedString.length) {
    newCursorOffset = newFormattedString.length;
  }
  if (newCursorOffset < 0) {
    newCursorOffset = 0;
  }

  return TextEditingValue(
    text: newFormattedString,
    selection: TextSelection.collapsed(offset: newCursorOffset),
  );
}
}
