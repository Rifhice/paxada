import sleep from '@/helpers/sleep';
import moment from 'moment';

describe('sleep', () => {
    test('Should wait the appropriate time', async (done) => {
        const start = moment();
        await sleep(1000);
        expect(Math.round(moment().diff(start, 'milliseconds') / 100)).toEqual(10);
        done();
    });
});
