import { ConfidentialClientApplication } from '@azure/msal-node'

const GRAPH = 'https://graph.microsoft.com/v1.0'

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
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text()}`)
  return res
}

export async function graphJson<T>(pathOrUrl: string, init?: RequestInit): Promise<T> {
  return (await graphRequest(pathOrUrl, init)).json() as Promise<T>
}