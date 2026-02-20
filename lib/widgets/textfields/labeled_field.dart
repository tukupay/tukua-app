import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class LabeledField extends StatefulWidget {
  final String label;
  final String hint;
  final bool enabled;
  final String? initialText;
  final bool? showOwner;
  final void Function(String? val)? changed;
  final bool? isNumber;
  final bool? multiLine;
  final TextEditingController? controller;
  final bool? canGoNext;
  final Icon? prefixIcon;
  final List<TextInputFormatter>? inputFormatters;
  final Widget? suffixIcon;
  final bool hasError;
  final String? errorText;
  const LabeledField({super.key,
    required this.label, 
    required this.hint, 
    required this.enabled,
   this.initialText,
  this.changed,
  this.showOwner,
  this.isNumber,
  this.multiLine,
  this.controller,
  this.canGoNext,
  this.prefixIcon,
    this.suffixIcon,
  this.inputFormatters,
  this.hasError = false,
  this.errorText});

  @override
  State<LabeledField> createState() => _LabeledFieldState();
}

class _LabeledFieldState extends State<LabeledField> {
  // holds the current text value
  String? _currentText='';

  @override
  void initState() {
    super.initState();
    // initialize with initial text if provided
    _currentText=widget.initialText??'';
  }

  // if initial text can change from parent widget
  @override
  void didUpdateWidget(covariant LabeledField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if(widget.initialText!=oldWidget.initialText){
      setState(() {
        _currentText=widget.initialText??'';
      });
    }
  }
  @override
  Widget build(BuildContext context) {
    // show the acc. owner info if:
    // showOwner is true and _currentValue is not empty
    final bool shouldShowOwner=widget.showOwner==true && _currentText!.isNotEmpty;

    return SizedBox(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label,style: widget.hasError
              ? Grays.smallestBolderPoppinsHint.copyWith(color: const Color(0xFFE53935))
              : Grays.smallestBolderPoppinsHint),
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: Colors.white,
            ),
            child: LoanTextField(
              suffixIcon: widget.suffixIcon,
              inputFormatters: widget.inputFormatters,
              prefixIcon: widget.prefixIcon,
              controller: widget.controller,
              multiline: widget.multiLine,
              borderColor: AppColors.lightGray,
              hint: widget.hint,
            initialText: widget.initialText,
            enabled: widget.enabled,
            changed: widget.changed?? (val){
                setState(() {
                  _currentText=val;
                });
            },
            isNumber: widget.isNumber,
            canGoNext: widget.canGoNext,
            hasError: widget.hasError),
          ),
          // Error message
          if (widget.hasError && widget.errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 2),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, size: 13, color: Color(0xFFE53935)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      widget.errorText!,
                      style: const TextStyle(
                        color: Color(0xFFE53935),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          // show verified acc. owner info
          if(shouldShowOwner)
          Row(
            children: [
              Icon(Icons.check_box,
                color: HexColor(AppColors.brightGreen),
              size: 14),
              Spaces.tinySideSpace,
              Text('Verified Account:',style: Blacks.tinyRubik),
              Spaces.tinySideSpace,
              Text('Peter Grifin',style: Greens.smallBoldInter)
            ],
          )
        ],
      ),
    );
  }
}
