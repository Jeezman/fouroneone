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
  // const logger = new Logger('fetchOfferings');
  // logger.log('fetching offerings');
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

    // Logger.log(`fetched ${offerings.length} offerings`);
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
      `Creating RFQ for \nAMOUNT:${amount} \nTO:${pfiDid} \nFROM:${JSON.stringify(customerDid.did.uri)} \nOFFERING:${JSON.stringify(selectedOffering)}`,
    );
    const client = await getTbdexHttpClient();
    console.log(client);
    const Rfq = client.Rfq;
    if (!Rfq) {
      logger.error('Rfq object is undefined');
      throw new Error('Rfq object is undefined');
    }

    const rfq = Rfq.create({
      metadata: {
        to: pfiDid,
        from: customerDid.did.uri,
        protocol: selectedOffering.metadata.protocol,
      },
      data: {
        offeringId: selectedOffering.metadata.id,
        payin: {
          kind: selectedOffering.data.payin.methods[0].kind,
          amount: amount.toString(),
          paymentDetails: {
            accountNumber: '123456789',
            routingNumber: '123455533',
          },
        },
        payout: {
          kind: selectedOffering.data.payout.methods[0].kind,
          paymentDetails: {
            accountNumber: '123456789',
            IBAN: '1323233234',
          },
        },
        claims: selectedCredentials,
      },
    });

    logger.log(`RFQ create success ${JSON.stringify(rfq, null, 2)}`);
    // try {
    //   await rfq.verifyOfferingRequirements(selectedOffering);
    // } catch (error) {
    //   logger.error(`Error verifying offering requirements: ${error.message}`);
    //   throw error; // Rethrow if needed to stop further execution
    // }

    try {
      console.log(customerDid);
      await rfq.sign(customerDid);
    } catch (error) {
      logger.error(`Error signing RFQ: ${error.message}`);
      throw error;
    }

    let exchange;
    try {
      exchange = await client.TbdexHttpClient.createExchange(rfq);
    } catch (error) {
      logger.error(`Error creating exchange: ${error.message}`);
      throw error; // Rethrow if needed
    }

    logger.log(
      `Exchange created successfully: ${JSON.stringify(exchange, null, 2)}`,
    );

    return { rfq, exchange };
  } catch (error) {
    console.error('Error creating RFQ or processing exchange: ', error.message);
  }
};

export const getExchange = async (rfq, offeringDID, customerDID) => {
  const client = await getTbdexHttpClient();
  try {
    const exchange = await client.TbdexHttpClient.getExchange({
      exchangeId: rfq.exchangeId,
      pfiDid: offeringDID,
      did: customerDID,
    });

    return exchange;
  } catch (error) {
    console.log('error fetching offerings ', error);
  }
};

export const createOrder = async (did, offering, rfq, selectedOffering) => {
  const logger = new Logger('CREATERORDER');
  const client = await getTbdexHttpClient();
  const order = client.Order;
  if (!order) {
    logger.error('order object is undefined');
    throw new Error('order object is undefined');
  }
  const create_order = order.create({
    metadata: {
      from: did.uri,
      to: offering.metadata.from,
      exchangeId: rfq.exchangeId,
      protocol: selectedOffering.metadata.protocol,
    },
  });

  return create_order;
};
