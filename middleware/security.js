const crypto = require('crypto');

/**
 * 安全中间件集合
 */

/**
 * XSS保护中间件
 */
function xssProtection() {
  return async (ctx, next) => {
    ctx.set('X-XSS-Protection', '1; mode=block');
    await next();
  };
}

/**
 * 内容类型嗅探保护
 */
function noSniff() {
  return async (ctx, next) => {
    ctx.set('X-Content-Type-Options', 'nosniff');
    await next();
  };
}

/**
 * 点击劫持保护
 */
function frameGuard(options = { action: 'deny' }) {
  return async (ctx, next) => {
    const { action, domain } = options;
    
    if (action === 'deny') {
      ctx.set('X-Frame-Options', 'DENY');
    } else if (action === 'sameorigin') {
      ctx.set('X-Frame-Options', 'SAMEORIGIN');
    } else if (action === 'allow-from' && domain) {
      ctx.set('X-Frame-Options', `ALLOW-FROM ${domain}`);
    }
    
    await next();
  };
}

/**
 * HSTS (HTTP严格传输安全)
 */
function hsts(options = {}) {
  const {
    maxAge = 31536000, // 1年
    includeSubDomains = true,
    preload = false
  } = options;

  return async (ctx, next) => {
    if (ctx.secure) {
      let value = `max-age=${maxAge}`;
      
      if (includeSubDomains) {
        value += '; includeSubDomains';
      }
      
      if (preload) {
        value += '; preload';
      }
      
      ctx.set('Strict-Transport-Security', value);
    }
    
    await next();
  };
}

/**
 * CSP (内容安全策略)
 */
function contentSecurityPolicy(options = {}) {
  const {
    directives = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  } = options;

  return async (ctx, next) => {
    const policy = Object.entries(directives)
      .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');

    ctx.set('Content-Security-Policy', policy);
    await next();
  };
}

/**
 * 生成随机nonce
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

module.exports = {
  xssProtection,
  noSniff,
  frameGuard,
  hsts,
  contentSecurityPolicy,
  generateNonce
};