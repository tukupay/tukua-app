// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_business_profile.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetLocalBusinessProfileCollection on Isar {
  IsarCollection<LocalBusinessProfile> get localBusinessProfiles =>
      this.collection();
}

const LocalBusinessProfileSchema = CollectionSchema(
  name: r'LocalBusinessProfile',
  id: 8145276208007720702,
  properties: {
    r'businessType': PropertySchema(
      id: 0,
      name: r'businessType',
      type: IsarType.string,
    ),
    r'certificateNumber': PropertySchema(
      id: 1,
      name: r'certificateNumber',
      type: IsarType.string,
    ),
    r'name': PropertySchema(
      id: 2,
      name: r'name',
      type: IsarType.string,
    ),
    r'pinNumber': PropertySchema(
      id: 3,
      name: r'pinNumber',
      type: IsarType.string,
    ),
    r'registrationDate': PropertySchema(
      id: 4,
      name: r'registrationDate',
      type: IsarType.dateTime,
    )
  },
  estimateSize: _localBusinessProfileEstimateSize,
  serialize: _localBusinessProfileSerialize,
  deserialize: _localBusinessProfileDeserialize,
  deserializeProp: _localBusinessProfileDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _localBusinessProfileGetId,
  getLinks: _localBusinessProfileGetLinks,
  attach: _localBusinessProfileAttach,
  version: '3.1.0+1',
);

int _localBusinessProfileEstimateSize(
  LocalBusinessProfile object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.businessType.length * 3;
  bytesCount += 3 + object.certificateNumber.length * 3;
  bytesCount += 3 + object.name.length * 3;
  bytesCount += 3 + object.pinNumber.length * 3;
  return bytesCount;
}

void _localBusinessProfileSerialize(
  LocalBusinessProfile object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.businessType);
  writer.writeString(offsets[1], object.certificateNumber);
  writer.writeString(offsets[2], object.name);
  writer.writeString(offsets[3], object.pinNumber);
  writer.writeDateTime(offsets[4], object.registrationDate);
}

LocalBusinessProfile _localBusinessProfileDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = LocalBusinessProfile();
  object.businessType = reader.readString(offsets[0]);
  object.certificateNumber = reader.readString(offsets[1]);
  object.id = id;
  object.name = reader.readString(offsets[2]);
  object.pinNumber = reader.readString(offsets[3]);
  object.registrationDate = reader.readDateTime(offsets[4]);
  return object;
}

P _localBusinessProfileDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _localBusinessProfileGetId(LocalBusinessProfile object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _localBusinessProfileGetLinks(
    LocalBusinessProfile object) {
  return [];
}

void _localBusinessProfileAttach(
    IsarCollection<dynamic> col, Id id, LocalBusinessProfile object) {
  object.id = id;
}

extension LocalBusinessProfileQueryWhereSort
    on QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QWhere> {
  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterWhere>
      anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension LocalBusinessProfileQueryWhere
    on QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QWhereClause> {
  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterWhereClause>
      idNotEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterWhereClause>
      idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension LocalBusinessProfileQueryFilter on QueryBuilder<LocalBusinessProfile,
    LocalBusinessProfile, QFilterCondition> {
  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'businessType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'businessType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'businessType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'businessType',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'businessType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'businessType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      businessTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'businessType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      businessTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'businessType',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'businessType',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> businessTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'businessType',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'certificateNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'certificateNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'certificateNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'certificateNumber',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'certificateNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'certificateNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      certificateNumberContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'certificateNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      certificateNumberMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'certificateNumber',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'certificateNumber',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> certificateNumberIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'certificateNumber',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'name',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      nameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      nameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'pinNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'pinNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'pinNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'pinNumber',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'pinNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'pinNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      pinNumberContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'pinNumber',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
          QAfterFilterCondition>
      pinNumberMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'pinNumber',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'pinNumber',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> pinNumberIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'pinNumber',
        value: '',
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> registrationDateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'registrationDate',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> registrationDateGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'registrationDate',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> registrationDateLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'registrationDate',
        value: value,
      ));
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile,
      QAfterFilterCondition> registrationDateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'registrationDate',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension LocalBusinessProfileQueryObject on QueryBuilder<LocalBusinessProfile,
    LocalBusinessProfile, QFilterCondition> {}

extension LocalBusinessProfileQueryLinks on QueryBuilder<LocalBusinessProfile,
    LocalBusinessProfile, QFilterCondition> {}

extension LocalBusinessProfileQuerySortBy
    on QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QSortBy> {
  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByBusinessType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'businessType', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByBusinessTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'businessType', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByCertificateNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'certificateNumber', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByCertificateNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'certificateNumber', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByPinNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pinNumber', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByPinNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pinNumber', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      sortByRegistrationDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.desc);
    });
  }
}

extension LocalBusinessProfileQuerySortThenBy
    on QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QSortThenBy> {
  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByBusinessType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'businessType', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByBusinessTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'businessType', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByCertificateNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'certificateNumber', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByCertificateNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'certificateNumber', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByPinNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pinNumber', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByPinNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pinNumber', Sort.desc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.asc);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QAfterSortBy>
      thenByRegistrationDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.desc);
    });
  }
}

extension LocalBusinessProfileQueryWhereDistinct
    on QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QDistinct> {
  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QDistinct>
      distinctByBusinessType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'businessType', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QDistinct>
      distinctByCertificateNumber({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'certificateNumber',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QDistinct>
      distinctByName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QDistinct>
      distinctByPinNumber({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'pinNumber', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<LocalBusinessProfile, LocalBusinessProfile, QDistinct>
      distinctByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'registrationDate');
    });
  }
}

extension LocalBusinessProfileQueryProperty on QueryBuilder<
    LocalBusinessProfile, LocalBusinessProfile, QQueryProperty> {
  QueryBuilder<LocalBusinessProfile, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<LocalBusinessProfile, String, QQueryOperations>
      businessTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'businessType');
    });
  }

  QueryBuilder<LocalBusinessProfile, String, QQueryOperations>
      certificateNumberProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'certificateNumber');
    });
  }

  QueryBuilder<LocalBusinessProfile, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }

  QueryBuilder<LocalBusinessProfile, String, QQueryOperations>
      pinNumberProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'pinNumber');
    });
  }

  QueryBuilder<LocalBusinessProfile, DateTime, QQueryOperations>
      registrationDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'registrationDate');
    });
  }
}
