import { DidDht } from '@web5/dids';

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
