import type { Address } from '../../config'
import { FetchJson, fetchJson } from '../../peripherals/fetchJson'
import type { Abi } from '../../types'
import type { URLString } from '../../utils/utility-types'
import { NetworkSymbol, symbolToNetworkId, UserProvidedNetworkSymbol } from '../networks'
import { networkToEtherscanUrl, UserEtherscanURLs } from './urls'

export async function getABIFromEtherscan(
  networkSymbol: NetworkSymbol,
  address: Address,
  apiKey: string,
  userNetworks: UserEtherscanURLs,
  fetch: FetchJson<EtherscanResponse> = fetchJson,
): Promise<Abi> {
  const apiUrl = getEtherscanLinkFromNetworkSymbol(networkSymbol, userNetworks)
  if (!apiUrl) {
    throw new Error(`Can't find network info for ${networkSymbol}`)
  }

  const url = `${apiUrl}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
  // @todo error handling for incorrect api keys
  const response = await fetch(url)

  if (response.status !== '1') {
    throw new Error(`Can't find mainnet abi for ${address}. Msg: ${JSON.stringify(response, null, 2)}`)
  }

  const abi = JSON.parse(response.result) as Abi

  return abi
}

function getEtherscanLinkFromNetworkSymbol(
  networkSymbol: NetworkSymbol,
  userNetworks: UserEtherscanURLs,
): URLString | undefined {
  if (isUserProvidedNetwork(networkSymbol, userNetworks)) {
    return userNetworks[networkSymbol]
  }

  const networkId = symbolToNetworkId[networkSymbol]

  return networkId && networkToEtherscanUrl[networkId]
}

function isUserProvidedNetwork(
  symbol: NetworkSymbol,
  userNetworks: UserEtherscanURLs,
): symbol is UserProvidedNetworkSymbol {
  return symbol in userNetworks
}

/**
 * @see https://docs.etherscan.io/api-endpoints/contracts
 */
export interface EtherscanResponse {
  status: string
  result: string
  message: 'OK' | 'NOTOK'
}
