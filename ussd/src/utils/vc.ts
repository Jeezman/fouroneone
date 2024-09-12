import { PresentationExchange } from '@web5/credentials';

/**
 * Utility function to select credentials based on the customer's credentials
 * and the presentation definition.
 *
 * @param {Array} customerCredentials - The credentials to select from (vcJwts).
 * @param {Object} requiredClaims - The presentation definition for the required claims.
 */
export const selectCredentials = (customerCredentials, requiredClaims) => {
  console.log(customerCredentials, requiredClaims);
  return PresentationExchange.selectCredentials({
    vcJwts: customerCredentials,
    presentationDefinition: requiredClaims,
  });
};
