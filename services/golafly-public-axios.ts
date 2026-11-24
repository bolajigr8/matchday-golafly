import axios from 'axios'

/* A token-free client for the Golafly API's PUBLIC routes — program lists,
 * program spots, and the player registration itself.
 *
 * Not fanAxios: that one signs the fan out on any 401, and a public page must
 * never be able to do that. Not golaflyAxios: that one is the admin's. Same
 * base URL as both (see fan-axios.ts on why the user API may differ). */
const publicAxios = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_GOLAFLY_USER_API_BASE_URL ||
    process.env.NEXT_PUBLIC_GOLAFLY_API_BASE_URL ||
    'https://api.golafly.com/api',
  headers: { Accept: 'application/json' },
})

export default publicAxios
