const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);
const brotliCompress = promisify(zlib.brotliCompress);

/**
 * 响应压缩中间件
 */
function compression(options = {}) {
  const {
    threshold = 1024, // 最小压缩阈值 (bytes)
    level = 6, // 压缩级别 (1-9)
    chunkSize = 1024,
    windowBits = 15,
    memLevel = 8,
    strategy = zlib.constants.Z_DEFAULT_STRATEGY,
    filter = defaultFilter
  } = options;

  return async (ctx, next) => {
    await next();

    // 检查是否需要压缩
    if (!shouldCompress(ctx, threshold, filter)) {
      return;
    }

    const acceptEncoding = ctx.request.header['accept-encoding'] || '';
    const body = ctx.body;

    if (!body) return;

    let compressed;
    let encoding;

    // 选择压缩算法
    if (acceptEncoding.includes('br')) {
      encoding = 'br';
      compressed = await brotliCompress(Buffer.from(JSON.stringify(body)));
    } else if (acceptEncoding.includes('gzip')) {
      encoding = 'gzip';
      compressed = await gzip(Buffer.from(JSON.stringify(body)), {
        level,
        chunkSize,
        windowBits,
        memLevel,
        strategy
      });
    } else if (acceptEncoding.includes('deflate')) {
      encoding = 'deflate';
      compressed = await deflate(Buffer.from(JSON.stringify(body)), {
        level,
        chunkSize,
        windowBits,
        memLevel,
        strategy
      });
    }

    if (compressed && encoding) {
      ctx.set('Content-Encoding', encoding);
      ctx.set('Vary', 'Accept-Encoding');
      ctx.body = compressed;
      ctx.length = compressed.length;
    }
  };
}

/**
 * 默认过滤器
 */
function defaultFilter(ctx) {
  const contentType = ctx.response.type;
  
  // 压缩文本类型
  return /text|json|javascript|css|xml|svg/.test(contentType);
}

/**
 * 检查是否应该压缩
 */
function shouldCompress(ctx, threshold, filter) {
  // 已经压缩过的不再压缩
  if (ctx.response.header['content-encoding']) {
    return false;
  }

  // 检查响应大小
  const length = ctx.length;
  if (length && length < threshold) {
    return false;
  }

  // 使用过滤器检查
  return filter(ctx);
}

module.exports = compression;