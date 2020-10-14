import axios from 'axios';
import qs from 'qs';
import { message as remind } from 'antd';
import Cookies from 'js-cookie';

export const logout = () => {
  const { pathname, origin } = window.location;
  localStorage.clear();
  Cookies.remove('selectedPortfoliosId');
  Cookies.remove('selectedSimulationPortfolioId');
  location.href = `${origin}/login?redirectFrom=${pathname}`;
};

const showStatus = (status) => {
  let message = '';
  switch (status) {
    case 400:
      message = '请求错误(400)';
      break;
    case 401:
      message = '未授权，请重新登录';
      break;
    case 403:
      message = '拒绝访问(403)';
      break;
    case 404:
      message = '请求出错(404)';
      break;
    case 405:
      message = '请求出错方式出错(405)';
      break;
    case 408:
      message = '请求超时(408)';
      break;
    case 500:
      message = '服务器错误(500)';
      break;
    case 501:
      message = '服务器未实现(501)';
      break;
    case 502:
      message = '网络错误(502)';
      break;
    case 503:
      message = '服务不可用(503)';
      break;
    case 504:
      message = '网络超时(504)';
      break;
    case 505:
      message = 'HTTP版本不受支持(505)';
      break;
    case 1001:
      message = 'Cookie验证失败';
      break;
    default:
      message = `连接出错(${status})!`;
  }
  return `${message}，请检查网络或联系管理员！`;
};

/*用正则表达式实现html转码*/
const htmlEncode = (str) => {
  let s = '';
  if (str === undefined || str.length === 0) return '';
  s = str.replace(/<script.*?>.*?<\/script>/ig, '');
  s = str.replace(/\b(script)\b/ig, '');
  s = str.replace(/<[^>]+>/g, '');

  return s;
};

const jsonType = (str) => {
  try {
    if (typeof JSON.parse(str) === 'object') {
      return true;
    }
  } catch (e) {

  }
  return false;
};

const isThrough = v => Object.prototype.toString.call(v) === '[object FormData]' || typeof v === 'string';

const request = axios.create({
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true,
  timeout: 300000,
  validateStatus: () => true
});

// 请求拦截器
request.interceptors.request.use(config => {
  if (config.method === 'post') {
    if (!isThrough(config.data)) {
      if (config.data) {
        for (const item in config.data) {
          if (!jsonType(config.data[item])) {
            if (typeof config.data[item] === 'string' && config.data[item] !== '') {
              config.data[item] = htmlEncode(config.data[item]);
            }
          }
        }
      }
    }
    config.data = isThrough(config.data) ? config.data : qs.stringify(config.data);
  }
  return config;
}, (error) => {
  error.data = {};
  error.data.msg = '代码异常，请联系管理员！';
  return Promise.reject(error);
});

// 响应拦截器
request.interceptors.response.use((response) => {
  const status = response.status;
  let msg = '';
  if (status < 200 || status >= 300) {
    msg = showStatus(status);
    if (typeof response.data === 'string') {
      response.data = { msg };
    } else {
      response.data.msg = msg;
    }
    if (status === 401 || status === 1001) {
      const { pathname } = window.location;
      if (pathname !== '/login') {
        logout();
      }
    } else if (status !== 403) {
      remind.error(msg);
    }
    return Promise.reject(response);
  }
  if (response.config.headers.throwError) {
    const errorMsg = response.data.errorMsg;
    if (errorMsg) { remind.error(errorMsg); }
    return Promise.resolve(response.data);
  }
  const data = response.config.responseType === 'arraybuffer' ? response : response.data.message;
  return Promise.resolve(data);
});

export default request;

