import fs from 'fs/promises';
import path from 'path';

// Define the path for the cookie storage file within the project's 'secrets' directory.
const COOKIE_FILE_PATH = path.resolve(process.cwd(), 'secrets', 'music-cookie.json');

// Define the structure for the cookie data.
interface CookieData {
  netease?: string;
  tencent?: string;
}

/**
 * Reads the cookie data from the JSON file.
 * If the file doesn't exist or is invalid, it returns an empty object.
 */
async function readCookieFile(): Promise<CookieData> {
  try {
    const data = await fs.readFile(COOKIE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file is not found or there's a parsing error, start with an empty slate.
    return {};
  }
}

/**
 * Writes the provided cookie data to the JSON file, creating directories if necessary.
 * @param data The cookie data to save.
 */
async function writeCookieFile(data: CookieData): Promise<void> {
  try {
    // Ensure the 'secrets' directory exists.
    await fs.mkdir(path.dirname(COOKIE_FILE_PATH), { recursive: true });
    // Write the cookie data to the file.
    await fs.writeFile(COOKIE_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[Cookie Manager] Failed to write cookie file:', error);
  }
}

// In-memory cache for the cookies to avoid frequent file reads.
let cookieCache: CookieData | null = null;

/**
 * Retrieves the cookie for a specific server, using a cache to improve performance.
 * @param server The music service provider ('netease' or 'tencent').
 * @returns The cookie string or an empty string if not found.
 */
export async function getCookie(server: 'netease' | 'tencent'): Promise<string> {
  if (cookieCache && cookieCache[server]) {
    return cookieCache[server] || '';
  }
  // Load from file if not in cache.
  cookieCache = await readCookieFile();
  return cookieCache[server] || '';
}

/**
 * Updates and saves the cookie for a specific server.
 * @param server The music service provider.
 * @param cookie The new cookie string.
 */
export async function setCookie(server: 'netease' | 'tencent', cookie: string): Promise<void> {
  // Ensure the cache is initialized.
  if (!cookieCache) {
    cookieCache = await readCookieFile();
  }
  // Update the cache and write to the file.
  cookieCache[server] = cookie;
  await writeCookieFile(cookieCache);
}

/**
 * Fetches a new cookie from the backend credential server and saves it.
 * This is triggered when the current cookie is likely expired or invalid.
 * @param server The music service provider.
 * @returns The new cookie string, or an empty string if the refresh fails.
 */
export async function refreshCookie(server: 'netease' | 'tencent'): Promise<string> {
  try {
    // 目前，此刷新逻辑仅为腾讯音乐实现，因为凭证服务器的响应格式是针对它的。
    if (server !== 'tencent') {
      console.warn(`[Cookie刷新] 未为 ${server} 实现刷新逻辑。`);
      return '';
    }

    console.log(`[Cookie刷新] 正在尝试为 ${server} 刷新cookie...`);
    const response = await fetch('http://local.zeusai.top:8898/credentials');
    if (!response.ok) {
      throw new Error(`凭证服务器返回状态: ${response.status}`);
    }
    
    const result = await response.json();

    // 根据用户提供的结构正确解析响应
    if (result.code === 200 && Array.isArray(result.data) && result.data.length > 0) {
      const credential = result.data[0];
      const { str_musicid, musickey } = credential;

      if (str_musicid && musickey) {
        // 为腾讯音乐构建cookie字符串
        const newCookie = `uin=${str_musicid}; qm_keyst=${musickey};`;
        
        await setCookie(server, newCookie);
        console.log(`[Cookie刷新] 已成功为 ${server} 刷新并保存cookie。`);
        return newCookie;
      } else {
        throw new Error('响应中的凭证对象缺少必需的字段 (str_musicid, musickey)。');
      }
    } else {
      throw new Error('来自凭证服务器的响应中数据数组无效或为空。');
    }
  } catch (error) {
    console.error(`[Cookie刷新] 为 ${server} 刷新cookie时出错:`, error);
    // 失败时返回空字符串，以防使用陈旧/错误的cookie
    return '';
  }
}
