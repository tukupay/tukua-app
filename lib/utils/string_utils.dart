class StringUtils{
  static String cleanPhoneNumber(String input) {
    final cleaned = input.replaceAll(RegExp(r'\D'), ''); // keep only digits
    return cleaned.trim();
  }
}