import { extname } from 'path'

import { makeError } from '../utils/makeError'
import { EthSdkConfig, parseEthSdkConfig } from './types'

export async function readConfig(filePath: string, requireJs: (id: string) => unknown): Promise<EthSdkConfig> {
  const extension = extname(filePath)

  try {
    let exported: unknown
    if (['.json', '.js', '.cjs'].includes(extension)) {
      exported = requireJs(filePath)
    } else if (extension === '.ts') {
      await registerTsNode()
      exported = requireJs(filePath)
    } else {
      throw new Error(`Unsupported config file extension: ${extension}`)
    }

    if (exported && typeof exported === 'object') {
      exported = (exported as Record<string, unknown>).default || exported
    }

    return parseEthSdkConfig(exported)
  } catch (err) {
    throw new Error(`Could not read config file: ${filePath}` + '\n' + makeError(err).message)
  }
}

async function registerTsNode() {
  try {
    const { register } = await import('ts-node')

    register({ compilerOptions: { module: 'CommonJS' } })
  } catch (error) {
    const err = makeError(error) as Error & { code?: string }
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`You need ts-node to write eth-sdk config in TypeScript.`)
    }
    throw err
  }
}
