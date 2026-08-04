/**
 * Load device address-book phones for Tukua Connect matching.
 */
import * as Contacts from 'expo-contacts';
import { log } from './logger';

export async function loadDeviceContactPhones(limit = 800): Promise<string[]> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      log.warn('Contacts', 'permission not granted', { status });
      return [];
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
      pageSize: limit,
    });
    const phones: string[] = [];
    for (const c of data || []) {
      for (const p of c.phoneNumbers || []) {
        const n = String(p.number || '').trim();
        if (n) phones.push(n);
      }
    }
    return [...new Set(phones)].slice(0, limit);
  } catch (e) {
    log.warn('Contacts', String(e));
    return [];
  }
}
