import { Logger } from '@nestjs/common';
import { PresentationExchange } from '@web5/credentials';
import axios from 'axios';

export const requestVc = async ({ name, country, did }) => {
  try {
    const response = await axios.get(
      `https://mock-idv.tbddev.org/kcc?name=${name}&country=${country}&did=${did}`,
    );
    return response;
  } catch (error) {
    console.log(error.message);
  }
};

export const selectCredentials = (customerCredentials, requiredClaims) => {
  const logger = new Logger('SelectCredentials');
  // Log the inputs to ensure they are as expected
  logger.log(
    `Select Credentials - required claims ${JSON.stringify(requiredClaims)}`,
  );

  // Check if customer credentials are present and requiredClaims is defined
  if (!customerCredentials || customerCredentials.length === 0) {
    logger.warn('No customer credentials available.');
    return [];
  }

  if (!requiredClaims) {
    logger.warn('No required claims provided.');
    return [];
  }

  try {
    const selected = PresentationExchange.selectCredentials({
      vcJwts: customerCredentials,
      presentationDefinition: requiredClaims,
    });

    // Check if selected credentials are empty
    if (selected.length === 0) {
      logger.warn('No matching credentials found.');
    } else {
      logger.log('Selected Credentials successfully');
    }

    return selected;
  } catch (error) {
    logger.error(`Error selecting credential ${error}`);
    return [];
  }
};
