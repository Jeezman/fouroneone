import { DidDht } from '@web5/dids';
import { mockPFIs } from './mockPFIs';

async function getTbdexHttpClient() {
  const module = await eval(`import("@tbdex/http-client")`);
  return module.TbdexHttpClient;
}

export const createDid = async () => {
  try {
    const did = await DidDht.create({
      options: { publish: false },
    });
    return { did };
  } catch (error) {
    console.log('error creating did ', error);
  }
};

export const fetchOfferings = async () => {
  try {
    const offerings = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, value] of mockPFIs) {
      const client = await getTbdexHttpClient();
      const _offerings = await client.getOfferings({
        pfiDid: value.uri,
      });
      console.log('offerings is ', _offerings);
      offerings.push(..._offerings);
    }

    return offerings;
  } catch (error) {
    console.log('error fetching offerings ', error);
  }
};
