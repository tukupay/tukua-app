import 'package:flutter/material.dart';
import 'package:hexcolor/hexcolor.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:tuku/constants/constants.dart';
import 'package:tuku/widgets/widget.dart';
class FavouritesSection<T> extends StatelessWidget {
  final String title;
  final List<T> items;
  final void Function() onAdd;
  final Widget Function(T item) itemBuilder;
  final void Function(T item)? onItemSelected;
  final String? emptyHint;

  const FavouritesSection({super.key,
  required this.title,
  required this.items,
  required this.onAdd,
  required this.itemBuilder,
  this.onItemSelected,
  this.emptyHint});

  @override
  Widget build(BuildContext context) {
    final size=MediaQuery.of(context).size;
    return SizedBox(
      width: size.width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,style: Blacks.smallestBolderPoppins),
          if(items.isEmpty)
            GestureDetector(
              onTap: onAdd,
              child: Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: HexColor('#E8EBE9'),
                    style: BorderStyle.solid,
                  ),
                  color: HexColor('#FAFBFA'),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen).withAlpha(15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedFavourite,
                        size: 18,
                        color: HexColor(AppColors.darkerGray2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'No favourites yet',
                            style: Blacks.smallestBoldPoppins,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            emptyHint ?? 'Save frequently used items for quick access',
                            style: Grays.smallestPoppinsHint,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: HexColor(AppColors.primaryGreen).withAlpha(15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        HugeIcons.strokeRoundedAdd01,
                        size: 16,
                        color: HexColor(AppColors.primaryGreen),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SizedBox(
              height: 80,
              width: size.width,
              child: Row(
                children: [
                  NewFavButton(tapped: onAdd),
                  Spaces.smallSideSpace,
                  Expanded(
                      child: ListView.builder(
                          padding: Paddings.tinyHorizontal,
                          shrinkWrap: true,
                          scrollDirection: Axis.horizontal,
                          itemCount: items.length,
                          itemBuilder: (context,index){
                            final fav=items[index];
                            return GestureDetector(
                              onTap: () => onItemSelected?.call(fav),
                              child: itemBuilder(fav)
                            );
                          }))
                ],
              ),
            )
        ],
      ),
    );
  }
}
