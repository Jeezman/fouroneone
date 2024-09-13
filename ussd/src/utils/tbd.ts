import { DidDht } from '@web5/dids';
import { mockPFIs } from './mockPFIs';
import { Logger } from '@nestjs/common';

async function getTbdexHttpClient() {
  const module = await eval(`import("@tbdex/http-client")`);
  return module.TbdexHttpClient;
}

export const createDid = async () => {
  try {
    const did = await DidDht.create({
      options: { publish: true },
    });
    return { did };
  } catch (error) {
    console.log('error creating did ', error);
  }
};

export const fetchOfferings = async () => {
  const logger = new Logger('fetchOfferings');
  logger.log('fetching offerings');
  try {
    const offerings = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, value] of mockPFIs) {
      const client = await getTbdexHttpClient();
      const _offerings = await client.getOfferings({
        pfiDid: value.uri,
      });
      offerings.push(..._offerings);
    }

    Logger.log(`fetched ${offerings.length} offerings`);
    return offerings;
  } catch (error) {
    console.log('error fetching offerings ', error);
  }
};

// New function to create RFQ

export const createRfq = async (
  pfiDid,
  customerDid,
  selectedOffering,
  selectedCredentials,
  amount, // New parameter for the payin amount
) => {
  try {
    const client = await getTbdexHttpClient();
    const Rfq = client.Rfq;

    // Create RFQ
    const rfq = Rfq.create({
      metadata: {
        to: pfiDid, // PFI's DID
        from: customerDid.uri, // Customer DID
        protocol: selectedOffering.metadata.protocol, // Protocol version from offering
      },
      data: {
        offeringId: selectedOffering.metadata.id, // The ID of the selected offering
        payin: {
          kind: selectedOffering.data.payin.methods[0].kind, // Payin method (USD_BANK_TRANSFER)
          amount: amount, // Use the passed-in amount
          paymentDetails: {
            // Assuming no required payment details for USD_BANK_TRANSFER
            accountNumber: '1234567890',
            routingNumber: '123456789',
          },
        },
        payout: {
          kind: selectedOffering.data.payout.methods[0].kind, // Payout method (GBP_BANK_TRANSFER)
          paymentDetails: {
            accountNumber: '3245231234', // Example payout account number
          },
        },
        claims: selectedCredentials, // Array of signed VCs required by the PFI
      },
    });

    console.log('RFQ created: ', rfq);
    return rfq;
  } catch (error) {
    console.log('Error creating RFQ: ', error);
  }
};
