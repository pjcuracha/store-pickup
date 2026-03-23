const CONSTANTS = {
  HongKongUrl: "hong-kong",
  TraditionalChinese: "zh-TW",
};

// Define the store address for pickup
// provinceCode:
// HK - Hong Kong Island
// KL - Kowloon
// NT - New Territories
const STORE_ADDRESSES = [
  {
    title: '門市自取(時代廣場)',
    enTitle: 'Store Pickup (Times Square)',
    address1: '時代廣場地庫B204店​',
    enAddress1: 'Shop B204, Basement, Times Square',
    city: '銅鑼灣​',
    enCity: 'Causeway Bay',
    provinceCode: 'HK',
    countryCode: 'HK',
    zip: '',
  },
  {
    title: '門市自取(海港城)',
    enTitle: 'Store Pickup (Harbour City)',
    address1: '海港城港威商場3樓3326號舖​',
    enAddress1: 'Shop 3326, Level 3, Gateway Arcade, Harbour City',
    city: '尖沙咀​',
    enCity: 'Tsim Sha Tsui',
    provinceCode: 'KL',
    countryCode: 'HK',
    zip: '',
  },
  {
    title: '門市自取(新城市廣場)',
    enTitle: 'Store Pickup (New Town Plaza)',
    address1: '新城市廣場三期A302號舖​',
    enAddress1: 'Shop A302, Phase 3, New Town Plaza',
    city: '沙田​',
    enCity: 'Sha Tin',
    provinceCode: 'NT',
    countryCode: 'HK',
    zip: '',
  },
  {
    title: '門市自取(朗豪坊)',
    enTitle: 'Store Pickup (Langham Place)',
    address1: '亞皆老街8號朗豪坊B1樓15號舖​',
    enAddress1: 'Shop 15, B1 Floor, Langham Place, 8 Argyle Street',
    city: '旺角​',
    enCity: 'Mong Kok',
    provinceCode: 'KL',
    countryCode: 'HK',
    zip: '',
  },
];

/**
 * Utility function to normalize a value for comparison, treating null and empty string as equivalent.
 * @param {string|null|undefined} value
 * @returns {string}
 */
const normalize = (value) => (value || '').toString().trim().toLowerCase();

/**
 * Checks whether two values are equal as strings, treating null and empty string as equivalent.
 * @param {string|null|undefined} first
 * @param {string|null|undefined} second
 * @returns {boolean}
 */
const isStringOrEmptyNullEqual = (first, second) => {
  return normalize(first) === normalize(second);
}

/**
 * Find matching store address from known store addresses
 * @param {Object} address - The delivery address to check
 * @param {boolean} isChineseLanguage - Whether the language is Chinese
 * @returns {Object|undefined} - The matching store record or undefined
 */
const findMatchingStoreAddress = (address, isChineseLanguage = true) => {
  if (!address) return undefined;

  return STORE_ADDRESSES.find((store) => {
    if (isChineseLanguage) {
      return (
        normalize(store.address1) === normalize(address.address1) &&
        normalize(store.city) === normalize(address.city) &&
        normalize(store.provinceCode) === normalize(address.provinceCode) &&
        normalize(store.countryCode) === normalize(address.countryCode) &&
        isStringOrEmptyNullEqual(store.zip, address.zip)
      );
    }

    return (
      normalize(store.enAddress1) === normalize(address.address1) &&
      normalize(store.enCity) === normalize(address.city) &&
      normalize(store.provinceCode) === normalize(address.provinceCode) &&
      normalize(store.countryCode) === normalize(address.countryCode) &&
      isStringOrEmptyNullEqual(store.zip, address.zip)
    );
  });
}

/**
 * Check if the provided address matches one of the store addresses
 * @param {Object} address - The delivery address to check
 * @param {boolean} isChineseLanguage - Whether the language is Chinese 
 * @returns {boolean} - True if address matches a store address
 */
const isStoreAddress = (address, isChineseLanguage = true) => {
  return !!findMatchingStoreAddress(address, isChineseLanguage);
}

/**
 * Check if a delivery option is a pickup option
 * @param {Object} deliveryOption - The delivery option to check
 * @returns {boolean} - True if it's a pickup option
 */
const isPickupOption = (deliveryOption) => {
  if (!deliveryOption) return false;

  const handle = deliveryOption.handle?.toLowerCase() || '';
  const title = deliveryOption.title?.toLowerCase() || '';

  return handle.includes('pickup') || handle.includes('pick-up') ||
         title.includes('pickup') || title.includes('pick-up') ||
         title.includes('in-store') || title.includes('門市自取');
}

export {
  CONSTANTS,
  STORE_ADDRESSES,
  normalize,
  findMatchingStoreAddress,
  isStringOrEmptyNullEqual,
  isStoreAddress,
  isPickupOption,
};
