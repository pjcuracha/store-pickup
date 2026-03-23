import {
  reactExtension,
  useDeliveryGroups,
  useApplyShippingAddressChange,
  useShippingAddress,
  useLanguage,
  useTranslate,
  useBuyerJourneyIntercept,
  Banner,
  BlockStack,
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState, useRef } from 'react';

import translationsHK from '../locales/zh-TW.json';
import { CONSTANTS, STORE_ADDRESSES, normalize, isStoreAddress } from '../../../utils/index.js';

// Using a target closer to the shipping address section
export default reactExtension(
  'purchase.checkout.delivery-address.render-before',
  () => <Extension />,
);

function Extension() {
  const deliveryGroups = useDeliveryGroups();
  const applyShippingAddressChange = useApplyShippingAddressChange();
  const shippingAddress = useShippingAddress();

  const language = useLanguage();
  const translate = useTranslate();
  const isChineseLanguage = language?.isoCode === CONSTANTS.TraditionalChinese;

  // Track previous selection to know when the user switches modes
  const [prevMethod, setPrevMethod] = useState('');
  const [showPickupMessage, setShowPickupMessage] = useState(false);
  const [isPickupMode, setIsPickupMode] = useState(false);
  const [pickupAddressChanged, setPickupAddressChanged] = useState(false);
  const prevSelectedPickupHandleRef = useRef('');
  const prevShippingAddressRef = useRef(null);

  // Use ref to prevent infinite loops - tracks if we're currently updating
  const isUpdatingAddress = useRef(false);

  const getSelectedStoreAddress = (selectedPickupOption) => {
    if (!selectedPickupOption) return undefined;

    return STORE_ADDRESSES.find((store) => {
      return (
        isChineseLanguage
          ? normalize(selectedPickupOption.title) === normalize(store.title)
          : normalize(selectedPickupOption.title) === normalize(store.enTitle)  
      );
    });
  };

  // Helper function to detect if pickup is selected (used consistently across all effects)
  const checkIfPickup = (deliveryGroups, shippingAddress, previousSelectedPickupHandle) => {
    const selectedOption = deliveryGroups[0]?.selectedDeliveryOption;
    const currentHandle = selectedOption?.handle || '';
    const currentTitle = selectedOption?.title || '';
    const handleLower = currentHandle.toLowerCase();
    const titleLower = currentTitle.toLowerCase();
    const deliveryGroup = deliveryGroups[0];

    // Method 1: Check if the SELECTED option is a pickup option (by matching handle)
    const selectedPickupOption = deliveryGroup?.deliveryOptions?.find(option => {
      // First, check if this option is a pickup option
      const optionHandle = option?.handle?.toLowerCase() || '';
      const optionTitle = option?.title?.toLowerCase() || '';
      const optionType = option?.type?.toLowerCase() || '';
      const optionCode = option?.code?.toLowerCase() || '';
      const isPickupOption = optionHandle.includes('pickup') ||
             optionTitle.includes('pickup') ||
             optionType === 'pickup' ||
             optionCode?.includes('pickup') ||
             optionHandle.includes('pick-up') ||
             optionTitle.includes('pick-up') ||
             optionTitle.includes('門市自取');

      // Then check if this option is the CURRENTLY SELECTED one
      return isPickupOption && option?.handle === currentHandle;
    });

    // Method 2: Check if shipping address matches store pickup address (in case the option doesn't have clear handles)
    const hasShippingAddressPickup = false;
    const selectedStore = selectedPickupOption != null ? getSelectedStoreAddress(selectedPickupOption) : undefined;

    // Method 3: Check for "handle" or similar properties || NG
    const hasPickupLocationHandle = deliveryGroup?.pickupLocationHandle != null ||
                                    selectedOption?.pickupLocationHandle != null;

    // Method 4: Check delivery address for pickup point address (only if it's different from shipping) || NG
    const deliveryAddress = deliveryGroup?.deliveryAddress;
    const hasPickupAddress = deliveryAddress?.address1 != null // &&
                            // deliveryAddress?.address1 !== '' &&
                            // deliveryAddress?.address1 !== shippingAddress?.address1 &&
                            // deliveryAddress?.address1 === STORE_ADDRESS.address1; // Must match store address

    // Final check: selected option must be pickup
    const isPickup = handleLower.includes('pickup') || handleLower.includes('pick-up') ||
                     titleLower.includes('pickup') || titleLower.includes('pick-up') ||
                     titleLower.includes('in-store') || titleLower.includes('門市自取') ||
                     selectedPickupOption != null ||
                     hasShippingAddressPickup ||
                     hasPickupLocationHandle ||
                     hasPickupAddress;

    const selectedPickupOptionChanged = selectedPickupOption?.handle !== previousSelectedPickupHandle;

    return {
      isPickup,
      selectedPickupOption,
      selectedPickupOptionChanged,
      hasShippingAddressPickup,
      hasPickupLocationHandle,
      hasPickupAddress,
      selectedStore,
      currentHandle,
      currentTitle,
    };
  };

  // Log when extension initializes
  useEffect(() => {
    console.log('🚀 [Pickup Extension] Extension initialized');
    console.log('🏪 [Pickup Extension] Store address:', STORE_ADDRESSES);
    // Reset updating flag on initialization
    isUpdatingAddress.current = false;
  }, []);

  useEffect(() => {
    const selectedOption = deliveryGroups[0]?.selectedDeliveryOption;
    const currentHandle = selectedOption?.handle || '';
    const currentTitle = selectedOption?.title || '';

    console.log('📦 [Pickup Extension] Delivery groups changed:', {
      deliveryGroupsCount: deliveryGroups.length,
      selectedOption: selectedOption,
      selectedOptionKeys: selectedOption ? Object.keys(selectedOption) : [],
      currentHandle: currentHandle,
      currentTitle: currentTitle,
      prevMethod: prevMethod,
      allDeliveryGroups: deliveryGroups,
    });

    // Use the shared helper function for consistent detection
    const detectionResult = checkIfPickup(deliveryGroups, shippingAddress, prevSelectedPickupHandleRef.current);
    const { isPickup, selectedPickupOption, selectedPickupOptionChanged, hasShippingAddressPickup, hasPickupLocationHandle, hasPickupAddress, selectedStore } = detectionResult;

    const deliveryGroup = deliveryGroups[0];

    const wasPickup = prevMethod.toLowerCase().includes('pickup') ||
                      prevMethod.toLowerCase().includes('pick-up') ||
                      prevMethod.toLowerCase().includes('in-store') ||
                      prevMethod.toLowerCase().includes('門市自取');

    const shippingAddressChanged = prevShippingAddressRef.current &&
      JSON.stringify(prevShippingAddressRef.current) !== JSON.stringify(shippingAddress);

    const pickupAddressChangedNow = isPickup && shippingAddressChanged;
    setPickupAddressChanged(pickupAddressChangedNow);

    console.log('🔍 [Pickup Extension] Pickup detection:', {
      shippingAddressChanged,
      pickupAddressChangedNow,
      isPickup,
      selectedPickupOptionChanged,
      detectionMethods: {
        selectedPickupOption: selectedPickupOption != null,
        hasShippingAddressPickup,
        hasPickupLocationHandle,
        hasPickupAddress,
      },
      wasPickup,
      currentHandle,
      currentTitle,
      deliveryOptions: deliveryGroup?.deliveryOptions,
      selectedDeliveryOption: deliveryGroup?.selectedDeliveryOption,
      deliveryAddress: deliveryGroup?.deliveryAddress,
      pickupLocationHandle: deliveryGroup?.pickupLocationHandle || selectedOption?.pickupLocationHandle,
      // Add state tracking for debugging
      currentIsPickupMode: isPickupMode,
      willUpdate: isPickup && !isPickupMode,
    });

    let addressToApply = selectedStore || STORE_ADDRESSES[0];
    if (!isChineseLanguage) {
      addressToApply = {
        ...addressToApply,
        address1: addressToApply.enAddress1,
        city: addressToApply.enCity
      }
    }

    // Only update if pickup state changed to prevent infinite loops
    if ((isPickup && !isPickupMode) || (isPickup && selectedPickupOptionChanged)) {
      console.log('✅ [Pickup Extension] Pickup selected - Setting store address');
      console.log('📤 [Pickup Extension] Sending address update with:', STORE_ADDRESSES);
      setIsPickupMode(true);
      setShowPickupMessage(true);
      isUpdatingAddress.current = true;

      // Force update the address to the store address (async operation)
      applyShippingAddressChange({
        type: 'updateShippingAddress',
        address: addressToApply,
      }).then((result) => {
        console.log('📍 [Pickup Extension] Address update result:', result);
        console.log('📍 [Pickup Extension] Result type:', result.type);
        console.log('📍 [Pickup Extension] Result errors:', result.errors);
        if (result.type === 'success') {
          console.log('✅ [Pickup Extension] Address successfully updated to:', addressToApply);
          console.log('🔍 [Pickup Extension] Current shippingAddress after update:', shippingAddress);
        } else {
          console.error('❌ [Pickup Extension] Address update failed:', result);
          console.error('❌ [Pickup Extension] Errors:', result.errors);
        }
        // Reset flag after update completes
        setTimeout(() => {
          isUpdatingAddress.current = false;
        }, 500);
      }).catch((error) => {
        console.error('❌ [Pickup Extension] Address update error:', error);
        console.error('❌ [Pickup Extension] Error details:', error.message, error.stack);
        // Reset flag even on error
        setTimeout(() => {
          isUpdatingAddress.current = false;
        }, 500);
      });

    } else if (!isPickup && isPickupMode) {
      console.log('🔄 [Pickup Extension] Switched from pickup to delivery - Clearing address');
      setIsPickupMode(false);
      setShowPickupMessage(false);
      isUpdatingAddress.current = true;

      // If user switched away from Pickup, clear ALL address fields so they can type their own
      applyShippingAddressChange({
        type: 'updateShippingAddress',
        address: {
          countryCode: 'HK', // Clear country first
          address1: '',
          address2: '',
          // city: '',
          // provinceCode: '',
          zip: '',
          phone: '',
          company: '',
        },
      }).then((result) => {
        console.log('🗑️ [Pickup Extension] Address clear result:', result);
        if (result.type === 'success') {
          console.log('✅ [Pickup Extension] Address successfully cleared');
        } else {
          console.error('❌ [Pickup Extension] Address clear failed:', result);
        }
        // Reset flag after update completes
        setTimeout(() => {
          isUpdatingAddress.current = false;
        }, 500);
      }).catch((error) => {
        console.error('❌ [Pickup Extension] Address clear error:', error);
        setTimeout(() => {
          isUpdatingAddress.current = false;
        }, 500);
      });
    } else {
      console.log('⚪ [Pickup Extension] No address update needed:', {
        isPickup,
        isPickupMode,
        reason: isPickup ? 'Already in pickup mode' : 'Not in pickup mode'
      });
    }

    // Store title for better tracking (handles can be hashes)
    prevSelectedPickupHandleRef.current = selectedPickupOption?.handle || '';
    prevShippingAddressRef.current = shippingAddress;
    setPrevMethod(currentTitle || currentHandle);
  }, [deliveryGroups, shippingAddress]);

  useBuyerJourneyIntercept(
    ({canBlockProgress}) => {
      return canBlockProgress
      && pickupAddressChanged && !isStoreAddress(shippingAddress, isChineseLanguage)
        ? {
          behavior: 'block',
          reason: 'Blocking checkout...'
        }
        : {
          behavior: 'allow',
        };
    }
  );

  // Note: Address monitoring removed - Shopify successfully updates the address
  // and monitoring was causing interference with the update process.
  // The address update in the main effect above is sufficient.
  // Render a banner when pickup is selected
  if (showPickupMessage && isStoreAddress(shippingAddress, isChineseLanguage)) {
    console.log('🎨 [Pickup Extension] Rendering info banner');
    return (
      <BlockStack spacing="base">
        <Banner status="warning">
          {isChineseLanguage
            ? translationsHK['storePickupSelectedWarning']
            : translate('storePickupSelectedWarning')}
        </Banner>
      </BlockStack>
    );
  }

  if (isPickupMode && !isStoreAddress(shippingAddress, isChineseLanguage)) {
    console.log('🎨 [Pickup Extension] Rendering error banner');
    return (
      <BlockStack spacing="base">
        <Banner status="critical">
          {isChineseLanguage
            ? translationsHK['storePickupSelectedCritical']
            : translate('storePickupSelectedCritical')}
        </Banner>
      </BlockStack>
    );
  }

  console.log('👻 [Pickup Extension] No UI rendered (pickup not selected)');
  return null; // This extension doesn't need to render any visible UI when not in pickup mode
}