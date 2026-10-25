import { ConfidentialClientApplication } from '@azure/msal-node'

const GRAPH = 'https://graph.microsoft.com/v1.0'
const REQUEST_TIMEOUT_MS = 30_000

export class GraphHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
    options?: ErrorOptions,
  ) {
    super(`Graph ${status}${code ? ` (${code})` : ''}: ${message}`, options)
    this.name = 'GraphHttpError'
  }
}

// Created lazily so dotenv has loaded before the env vars are read.
let msal: ConfidentialClientApplication | undefined

async function getToken() {
  msal ??= new ConfidentialClientApplication({
    auth: {
      clientId: process.env.GRAPH_CLIENT_ID!,
      authority: `https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID}`,
      clientSecret: process.env.GRAPH_CLIENT_SECRET!,
    },
  })

  const result = await msal.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  })
  return result!.accessToken
}

export async function graphRequest(pathOrUrl: string, init: RequestInit = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${GRAPH}${pathOrUrl}`
  const token = await getToken()
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const res = await fetch(url, {
    ...init,
    signal: init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!res.ok) {
    let responseBody: string
    try {
      responseBody = await res.text()
    } catch (error) {
      throw new GraphHttpError(res.status, null, 'Could not read the error response', { cause: error })
    }

    let code: string | null = null
    let message = responseBody || res.statusText
    try {
      const error = (JSON.parse(responseBody) as {
        error?: { code?: unknown; message?: unknown }
      } | null)?.error
      if (typeof error?.code === 'string') code = error.code
      if (typeof error?.message === 'string') message = error.message
    } catch {
      message = responseBody || res.statusText
    }

    throw new GraphHttpError(res.status, code, message)
  }
  return res
}

export async function graphJson<T>(pathOrUrl: string, init?: RequestInit): Promise<T> {
  return (await graphRequest(pathOrUrl, init)).json() as Promise<T>
}