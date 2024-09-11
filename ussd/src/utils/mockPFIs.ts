export const _mockPFIs = {
  aquafinance_capital: {
    uri: 'did:dht:qewzcx3fj8uuq7y551deqdfd1wbe6ymicr8xnua3xzkdw4n6j3bo',
    name: 'AquaFinance Capital',
    description:
      'Provides exchanges with the Ghanaian Cedis: GHS to USDC, GHS to KES',
  },
  // swiftliquidity_solutions: {
  //   uri: 'did:dht:zz3m6ph36p1d8qioqfhp5dh5j6xn49cequ1yw9jnfxbz1uyfnddy',
  //   name: 'SwiftLiquidity Solutions',
  //   description:
  //     'Offers exchange rates with the South African Rand: ZAR to BTC and EUR to ZAR.',
  // },
  flowback_financial: {
    uri: 'did:dht:gxwaxgihty7ar5u44gcmmdbw4ka1rbpj8agu4fom6tmsaz7aoffo',
    name: 'Flowback Financial',
    description:
      'Offers international rates with various currencies - USD to GBP, GBP to CAD.',
  },
  vertex_liquid_assets: {
    uri: 'did:dht:7zkzxjf84xuy6icw6fyjcn3uw14fty4umqd3nc4f8ih881h6bjby',
    name: 'Vertex Liquid Assets',
    description:
      'Offers currency exchanges between African currencies - MAD to EGP, GHS to NGN.',
  },
  titanium_trust: {
    uri: 'did:dht:kuggrw7nx3n4ehz455stdkdeuaekfjimhnbenpo8t4xz9gb8qzyy',
    name: 'Titanium Trust',
    description:
      'Provides offerings to exchange USD to African currencies - USD to GHS, USD to KES.',
  },
};

export const mockPFIs = new Map(Object.entries(_mockPFIs));
