import { DidDht } from '@web5/dids';
import { mockPFIs } from './mockPFIs';
import { Logger } from '@nestjs/common';

async function getTbdexHttpClient() {
  const module = await eval(`import("@tbdex/http-client")`);
  return module;
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
      const _offerings = await client.TbdexHttpClient.getOfferings({
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
  amount,
) => {
  try {
    const logger = new Logger('CREATERFQ');
    logger.log(
      `Creating RFQ for \nAMOUNT:${amount} \nTO:${pfiDid} \nFROM:${JSON.stringify(customerDid)} \nOFFERING:${JSON.stringify(selectedOffering)}`,
    );
    const client = await getTbdexHttpClient();
    const Rfq = client.Rfq;
    if (!Rfq) {
      logger.error('Rfq object is undefined');
      throw new Error('Rfq object is undefined');
    }

    const rfq = Rfq.create({
      metadata: {
        to: pfiDid,
        from: customerDid.uri,
        protocol: selectedOffering.metadata.protocol,
      },
      data: {
        offeringId: selectedOffering.metadata.id,
        payin: {
          kind: selectedOffering.data.payin.methods[0].kind,
          amount: amount.toString(),
          paymentDetails: {
            accountNumber: '1234567890',
            routingNumber: '123456789',
          },
        },
        payout: {
          kind: selectedOffering.data.payout.methods[0].kind,
          paymentDetails: {
            accountNumber: '3245231234',
          },
        },
        claims: selectedCredentials,
      },
    });
    logger.log(`RFQ create success ${JSON.stringify(rfq, null, 2)}`);
    return rfq;
  } catch (error) {
    console.error('Error creating RFQ: ', error.message);
  }
};
