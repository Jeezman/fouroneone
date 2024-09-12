import { PresentationExchange } from '@web5/credentials';

export const selectCredentials = (customerCredentials, requiredClaims) => {
  // Log the inputs to ensure they are as expected
  console.log(
    'Customer Credentials:',
    JSON.stringify(customerCredentials, null, 2),
  );
  console.log('Required Claims:', JSON.stringify(requiredClaims, null, 2));

  // Check if customer credentials are present and requiredClaims is defined
  if (!customerCredentials || customerCredentials.length === 0) {
    console.error('No customer credentials available.');
    return [];
  }

  if (!requiredClaims) {
    console.error('No required claims provided.');
    return [];
  }

  try {
    const selected = PresentationExchange.selectCredentials({
      vcJwts: customerCredentials,
      presentationDefinition: requiredClaims,
    });

    // Check if selected credentials are empty
    if (selected.length === 0) {
      console.warn('No matching credentials found.');
    } else {
      console.log('Selected Credentials:', JSON.stringify(selected, null, 2));
    }

    return selected;
  } catch (error) {
    console.error('Error during credential selection:', error);
    return [];
  }
};
