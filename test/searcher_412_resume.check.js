const assert = require('assert');
const bili = require('../lib/net/bili');
const { Searcher } = require('../lib/core/searcher');
const utils = require('../lib/utils');

const bannedResponse = '[响应错误]HTTP状态码: 412 响应数据:\n{"code":-412,"message":"request was banned","ttl":1}';
const successResponse = JSON.stringify({
    code: 0,
    data: { items: [], has_more: 0, offset: 'next' }
});

async function run(responses, offset = 'cursor') {
    const calls = [];
    const delays = [];
    const originalRequest = bili.getOneDynamicInfoByUID;
    const originalDelay = utils.delay;

    bili.getOneDynamicInfoByUID = async (hostMid, requestOffset) => {
        calls.push([hostMid, requestOffset]);
        return responses.shift();
    };
    utils.delay = async milliseconds => delays.push(milliseconds);

    try {
        const result = await Searcher.checkAllDynamic(123, 1, 0, offset);
        return { calls, delays, result };
    } finally {
        bili.getOneDynamicInfoByUID = originalRequest;
        utils.delay = originalDelay;
    }
}

(async () => {
    const resumed = await run([bannedResponse, successResponse]);
    assert.deepStrictEqual(resumed.calls, [[123, 'cursor'], [123, 'cursor']]);
    assert.deepStrictEqual(resumed.delays, [2 * 60 * 60 * 1000]);
    assert.strictEqual(resumed.result.offset, 'next');

    const normal = await run([successResponse]);
    assert.strictEqual(normal.calls.length, 1);
    assert.deepStrictEqual(normal.delays, []);

    const otherError = await run(['[响应错误]HTTP状态码: 500']);
    assert.strictEqual(otherError.calls.length, 1);
    assert.deepStrictEqual(otherError.delays, []);
    assert.strictEqual(otherError.result, null);

    const similarCode = await run(['{"code":-412.5}']);
    assert.strictEqual(similarCode.calls.length, 1);
    assert.deepStrictEqual(similarCode.delays, []);
    assert.strictEqual(similarCode.result, null);

    console.log('searcher_412_resume.test ... ok!');
})();
