import { assert, IsExact } from 'conditional-type-checks'
import { expect } from 'earljs'
import { ethers } from 'ethers'

import { env } from './env'
import { getMainnetSdk, MainnetSdk } from './sdk'
import type { Dai, Mkr, ProxyCustomImplementation, ProxyStandardStorageSlot, Uniswap } from './sdk/types'

describe('sdk', () => {
  const provider = new ethers.providers.JsonRpcProvider(env.E2E_RPC)
  const signer = ethers.Wallet.createRandom().connect(provider)

  const sdk = getMainnetSdk(signer)

  it('works', async () => {
    expect((await sdk.tokens.dai.totalSupply()).toString()).not.toEqual('0')
    expect((await sdk.tokens.mkr.totalSupply()).toString()).not.toEqual('0')

    // assert sdk shape
    assert<IsExact<MainnetSdk, typeof sdk>>(true)
    assert<
      IsExact<
        MainnetSdk,
        {
          tokens: { dai: Dai; mkr: Mkr }
          uniswap: Uniswap
          proxies: {
            proxyStandardStorageSlot: ProxyStandardStorageSlot
            proxyCustomImplementation: ProxyCustomImplementation
          }
        }
      >
    >(true)
  })

  describe('proxies', () => {
    it('fetches implementation for the standard storage slot 0x360894...', async () => {
      const contract = sdk.proxies.proxyStandardStorageSlot
      expect(await contract.name()).toEqual('1 Set Dollar Stake')
    })

    it('fetches implementation for custom proxy', async () => {
      const contract = sdk.proxies.proxyCustomImplementation

      const maxAssets = await contract.maxAssets()
      const isComptroller = await contract.isComptroller()

      expect(maxAssets.gt(0)).toEqual(true)
      expect(isComptroller).toEqual(true)
    })
  })
})
