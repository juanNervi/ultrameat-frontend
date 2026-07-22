/** Join a public asset path with the app baseURL (GitHub Pages safe). */
export function publicAsset(path: string) {
  const config = useRuntimeConfig()
  const base = config.app.baseURL || '/'
  const clean = path.replace(/^\//, '')
  return `${base}${clean}`.replace(/([^:]\/)\/+/g, '$1')
}
