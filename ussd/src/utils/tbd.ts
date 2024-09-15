import { DidDht, BearerDid, PortableDid } from '@web5/dids';
import { mockPFIs } from './mockPFIs';
import { Logger } from '@nestjs/common';

async function getTbdexHttpClient() {
  const module = await eval(`import("@tbdex/http-client")`);
  return module;
}

export const createDid = async () => {
  try {
    const _did: BearerDid = await DidDht.create({
      options: { publish: true },
    });
    const did = await _did.export();
    return { did };
  } catch (error) {
    console.log('error creating did ', error);
  }
};

export const fetchOfferings = async () => {
  Logger.log('fetching offerings');
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

export const createRfq = async (
  pfiDid: string,
  customerDid: PortableDid,
  selectedOffering,
  selectedCredentials,
  amount: string,
) => {
  try {
    const logger = new Logger('CREATERFQ');
    logger.log(
      `Creating RFQ for \nAMOUNT:${amount} \nTO:${pfiDid} \nFROM:${JSON.stringify(customerDid)} \nOFFERING:${JSON.stringify(selectedOffering)}`,
    );
    const client = await getTbdexHttpClient();
    const importCustomerDid = await DidDht.import({ portableDid: customerDid });
    const rfq = client.Rfq.create({
      metadata: {
        to: pfiDid,
        from: importCustomerDid.uri,
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
          },
        },
        claims: selectedCredentials,
      },
    });
    logger.log(`RFQ create success ${JSON.stringify(rfq, null, 2)}`);
    try {
      logger.log(`RFQ verify offering`);
      await rfq.verifyOfferingRequirements(selectedOffering);
    } catch (error) {
      logger.error(`Error verifying offering requirements: ${error.message}`);
      throw error; // Rethrow if needed to stop further execution
    }

    try {
      logger.log(`RFQ SIGN: ${JSON.stringify(importCustomerDid)}`);
      await rfq.sign(importCustomerDid);
      logger.log(`RFQ SIGN SUCCESS`);
    } catch (error) {
      logger.error(`Error signing RFQ: ${error.message}`);
      throw error;
    }

    try {
      await client.TbdexHttpClient.createExchange(rfq);
      logger.log(`Exchange created successfully`);
    } catch (error) {
      logger.error(`Error creating exchange: ${error.message}`);
      throw error; // Rethrow if needed
    }

    logger.log(
      `PROCESS Quote check pfiDid: ${pfiDid} metadataFrom: ${selectedOffering.metadata.from}`,
    );

    const exchange = await processQuote({
      exchangeId: rfq.exchangeId,
      pfiDid: pfiDid,
      customerDid: importCustomerDid,
    });

    logger.log(
      `Exchange created successfully ${JSON.stringify(exchange, null, 2)}`,
    );

    const order = await placeOrder({
      customerDid: importCustomerDid,
      pfiDid: pfiDid,
      exchangeId: exchange.exchangeId,
      selectedOffering,
    });

    logger.log(`SIGN ORDER`);
    await order.sign(importCustomerDid);
    logger.log(`SIGN ORDER SUCCESS`);

    logger.log(`SUBMIT ORDER`);
    await client.TbdexHttpClient.submitOrder(order);
    logger.log(`SUBMIT ORDER SUCCESS`);

    logger.log(`FINALIZING TX`);
    const transactionStatus = await finalizeTransaction({
      exchangeId: rfq.exchangeId,
      pfiDid: pfiDid,
      customerDid: importCustomerDid,
    });
    logger.log(`FINALIZING TX SUCCESS `, { transactionStatus });

    return { rfq };
  } catch (error) {
    console.error('Error creating RFQ or processing exchange: ', error.message);
  }
};

export const placeOrder = async ({
  customerDid,
  pfiDid,
  exchangeId,
  selectedOffering,
}) => {
  const logger = new Logger('CREATERORDER');
  const client = await getTbdexHttpClient();
  const importCustomerDid = await DidDht.import({ portableDid: customerDid });

  logger.log(`Create order with `, {
    from: customerDid.uri,
    to: pfiDid,
    exchangeId: exchangeId,
    protocol: selectedOffering.metadata.protocol,
  });

  const order = client.Order.create({
    metadata: {
      from: customerDid.uri,
      to: pfiDid,
      exchangeId,
      protocol: selectedOffering.metadata.protocol,
    },
  });

  logger.log(`Create order success`, { order });

  logger.log(`SIGN ORDER`);
  await order.sign(importCustomerDid);
  logger.log(`SIGN ORDER SUCCESS`);

  logger.log(`SUBMIT ORDER`);
  await client.TbdexHttpClient.submitOrder(order);
  logger.log(`SUBMIT ORDER SUCCESS`);
  return order;
};

export const processQuote = async ({ pfiDid, customerDid, exchangeId }) => {
  const logger = new Logger('PROCESSQUOTE');
  const client = await getTbdexHttpClient();

  let attempts = 0;
  const maxAttempts = 30;
  const delay = 500;
  let quote;
  let close;

  logger.log(`Processing quote for exchangeId: ${exchangeId}`, {
    attempts,
    quote,
  });

  while (!quote && attempts < maxAttempts) {
    try {
      logger.log(`Quote message to exchangeId: ${exchangeId} with`, {
        pfiDid,
        customerDid,
      });
      const exchange = await client.TbdexHttpClient.getExchange({
        pfiDid: pfiDid,
        did: customerDid,
        exchangeId: exchangeId,
      });

      quote = exchange.find((msg) => msg instanceof client.Quote);

      logger.log(
        `Quote from exchange: ${JSON.stringify(exchange, null, 2)} \n${JSON.stringify(quote, null, 2)}`,
      );

      if (!quote) {
        logger.log(
          `Exchange is still open. Waiting 2 seconds before making another request`,
        );
        close = exchange.find((msg) => msg instanceof client.Close);

        if (close) {
          logger.log(`Exchange is closed. Closing the exchange`);
          break;
        } else {
          // Wait seconds before making another request
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } else {
        return quote;
      }
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 401) {
        // Waiting on RFQ to be processed
        logger.log(
          `Waiting on RFQ to be processed. Waiting milliseconds before making another request`,
        );
      } else throw e;
    }
    attempts++;
  }
};

export const finalizeTransaction = async ({
  pfiDid,
  customerDid,
  exchangeId,
}) => {
  const logger = new Logger('FINALIZETRANSACTION');
  const client = await getTbdexHttpClient();

  let attempts = 0;
  const maxAttempts = 30;
  const delay = 500;
  let close;

  logger.log(`Processing finalize tx for exchangeId: ${exchangeId}`, {
    attempts,
    close,
  });

  while (!close && attempts < maxAttempts) {
    try {
      logger.log(`Finalize tx to exchangeId: ${exchangeId} with`, {
        pfiDid,
        customerDid,
      });
      const exchange = await client.TbdexHttpClient.getExchange({
        pfiDid: pfiDid,
        did: customerDid,
        exchangeId: exchangeId,
      });

      for (const message of exchange) {
        if (message instanceof client.Close) {
          close = message;
        }
      }
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 401) {
        // Waiting on RFQ to be processed
      } else throw e;
    }
    attempts++;
    if (!close) await new Promise((resolve) => setTimeout(resolve, delay));
  }
  const reasonForClose = close.data.reason;
  const closeSuccess = close.data.success;

  return { reasonForClose, closeSuccess };
};
