import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:tuku/repository/repository.dart';
import '../models/models.dart';
import '../endpoints/endpoints.dart';

import 'auth_http.dart';

class ContactsService implements ContactsRepository {
  final AuthHttp _http = AuthHttp();

  @override
  Future<ContactGroupResponse> createContactGroup(
      ContactGroupRequest group) async {
    final resp = await _http.post(Uri.parse(Contacts().createGroup),
        body: json.encode(group.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("CREATE GROUP SAYS $jsonData");
    final result = ContactGroupResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<ContactGroupResponse>> listContactGroups() async {
    final resp = await _http.get(Uri.parse(Contacts().allGroups));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("LIST GROUPS SAYS $jsonData");
    List<ContactGroupResponse> groups = [];
    if (jsonData is List) {
      for (dynamic json in jsonData) {
        final result = ContactGroupResponse.fromJson(json);
        groups.add(result);
      }
    }
    return groups;
  }

  @override
  Future<FullGroup> listGroupContacts(int groupId) async {
    final resp = await _http.get(Uri.parse(Contacts().getGroup(groupId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("LIST GROUP CONTACTS SAYS $jsonData");
    final result = FullGroup.fromJson(jsonData);
    return result;
  }

  @override
  Future<ContactGroupResponse> updateContactGroup(
      int groupId, ContactGroupRequest group) async {
    final resp = await _http.put(Uri.parse(Contacts().updateGroup(groupId)),
        body: json.encode(group.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("UPDATE GROUP SAYS $jsonData");
    final result = ContactGroupResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<String?> deleteContactGroup(int groupId) async {
    final resp = await _http.delete(Uri.parse(Contacts().deleteGroup(groupId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("DELETE GROUP SAYS $jsonData");
    String? errors = jsonData['errors'];
    return errors;
  }

  @override
  Future<ContactResponse> createContact(ContactRequest contact) async {
    final resp = await _http.post(Uri.parse(Contacts().createContact),
        body: json.encode(contact.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("CREATE CONTACT SAYS $jsonData");
    final result = ContactResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<FullContact>> getContacts() async {
    final resp = await _http.get(Uri.parse(Contacts().allContacts));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET CONTACTS SAYS $jsonData");
    List<FullContact> contacts = [];
    if (jsonData is List) {
      for (dynamic json in jsonData) {
        final result = FullContact.fromJson(json);
        contacts.add(result);
      }
    }
    return contacts;
  }

  @override
  Future<FullContact> getContact(int contactId) async {
    final resp = await _http.get(Uri.parse(Contacts().getContact(contactId)));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET CONTACT SAYS $jsonData");
    final result = FullContact.fromJson(jsonData);
    return result;
  }

  @override
  Future<ContactResponse> updateContact(
      int contactId, ContactRequest contact) async {
    final resp = await _http.put(Uri.parse(Contacts().updateContact(contactId)),
        body: json.encode(contact.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("UPDATE CONTACT SAYS $jsonData");
    final result = ContactResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<String?> deleteContact(int contactId) async {
    final resp = await _http.delete(Uri.parse(Contacts().deleteContact(contactId)));
    final data = resp.body;
    debugPrint("DELETE CONTACT SAYS RESP IS EMPTY ${data.isEmpty}");
    dynamic jsonData;
    if (data.isNotEmpty) {
      jsonData = json.decode(data);
      String? errors = jsonData['errors'];
      return errors;
    } else {
      return null;
    }
  }

  @override
  Future<ContactResponse> addFavourite(ContactRequest contact) async {
    final resp = await _http.post(Uri.parse(Contacts().favourites),
        body: json.encode(contact.toJson()));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("ADD FAVOURITE SAYS $jsonData");
    final result = ContactResponse.fromJson(jsonData);
    return result;
  }

  @override
  Future<List<FullContact>> getFavourites() async {
    final resp = await _http.get(Uri.parse(Contacts().favourites));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET FAVOURITES SAYS $jsonData");
    List<FullContact> contacts = [];
    if (jsonData is List) {
      for (dynamic json in jsonData) {
        final result = FullContact.fromJson(json);
        contacts.add(result);
      }
    }
    return contacts;
  }

  @override
  Future<List<String>> getGroupsContacts(List<int> groupIds)async{
    final resp = await _http.post(Uri.parse(Contacts().groupsContacts),
      body: json.encode({'group_ids':groupIds}));
    final data = resp.body;
    final jsonData = json.decode(data);
    debugPrint("GET GROUPS CONTACTS SAYS $jsonData");
    List<String> contacts = [];
    if (jsonData['phone_numbers'] is List) {
      for (dynamic json in jsonData['phone_numbers']) {
        contacts.add(json.toString());
      }
    }
    return contacts;
  }
}
