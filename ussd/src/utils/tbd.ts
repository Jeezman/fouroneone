import { Web5 } from '@web5/api';
import { VerifiableCredential } from '@web5/credentials';

export const createDid = async () => {
  // TBD
  const { web5, did } = await Web5.connect();

  // @ts-ignore
  const { did: bearerDid } = await web5.agent.identity.get({ didUri: did });

  return { bearerDid, did };
};
